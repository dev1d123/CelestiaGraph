import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { setCameraState, getCameraState } from '../state/cameraStore';

interface UniverseProps {
	autoRotate?: boolean;
	background?: string;
	onSunSelect?: (data: { galaxy: string; sunIndex: number; article?: string }) => void;
	galaxies?: string[];
	galaxyArticles?: Record<string, string[]>;
}

export interface UniverseRef {
	focusGalaxy: (name: string) => void;
}

interface GalaxyConfig {
	label: string;
	count: number;
	radius: number;
	branches: number;
	spin: number;
	randomness: number;
	randomnessPower: number;
	insideColor: number;
	outsideColor: number;
	position: THREE.Vector3;
	size: number;
}

interface SunParams {
	sunSize: number;
	glowIntensity: number;
	orbitSpeed: number;
	rotationSpeed: number;
	coreColor: number;
	glowColor: number;
}

const colorPairs: Array<[number, number]> = [
	[0xffd66b, 0xeb4d2d], [0x73d7ff, 0x264bff], [0xe4b1ff, 0x6f2fb8], [0xa6ff9e, 0x1d7f38],
	[0xffffff, 0x657bff], [0xffb37d, 0xf25c54], [0x9dffef, 0x1e6f74], [0xf6afff, 0x7d31c7],
	[0xc4ff77, 0x347f1d], [0xfff4b3, 0xff8c42]
];

const sunParams: SunParams = {
	sunSize: 0.10, // reducido (antes 0.18)
	glowIntensity: 1.3, // ligera reducción
	orbitSpeed: 0.4,
	rotationSpeed: 0.7,
	coreColor: 0xffd277,
	glowColor: 0xffaa33,
};

let sunGUI: dat.GUI | null = null;
let sunFolderAdded = false;

const MAX_PARTICLES_PER_GALAXY = 2200;               // nuevo (cap duro por galaxia)
const GLOBAL_PARTICLE_BUDGET = 95000;                // límite total
const LABEL_UPDATE_SKIP = 2;                         // actualizar labels cada N frames
const MAX_GALAXY_VIEW_DISTANCE = 20;                 // reducido (antes 55) galaxias más lejos se ocultan
// cache de materiales (reduce objetos)
const pointsMaterialCache = new Map<string, THREE.PointsMaterial>();

const Universe = forwardRef<UniverseRef, UniverseProps>(({
	autoRotate = true,
	background = 'transparent',
	onSunSelect,
	galaxies: galaxyLabels = ['Tema A', 'Tema B'], // renamed to avoid shadow
	galaxyArticles = {},
	...rest
}, ref) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const animationIdRef = useRef<number | null>(null);
	const labelLayerRef = useRef<HTMLDivElement | null>(null);
	const galaxyNodesRef = useRef<Record<string, { group: THREE.Object3D; center: THREE.Vector3; radius: number }>>({});
	const focusGalaxyRef = useRef<(center: THREE.Vector3, radius: number) => void>(() => {});

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		const labelLayer = labelLayerRef.current;
		if (!container || !canvas || !labelLayer) return;

		const scene = new THREE.Scene();
		sceneRef.current = scene;

		if (background && background !== 'transparent') {
			scene.background = new THREE.Color(background);
		}

		// Sutil nebulosa / ambient
		const fogColor = new THREE.Color(0x03060a);
		scene.fog = new THREE.FogExp2(new THREE.Color(fogColor.getHex()), 0.02); // densidad reducida

		// Cámara
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || window.innerHeight;
		const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 120); // far reducido (antes 200)
		// Vista cenital inicial
		camera.position.set(0, 28, 0.01);
		camera.lookAt(0, 0, 0);
		scene.add(camera);
		cameraRef.current = camera;

		// Luz tenue (para posible futura adición de elementos)
		const hemi = new THREE.HemisphereLight(0x6688ff, 0x080820, 0.6);
		scene.add(hemi);

		// Renderer
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // ligero clamp
		renderer.setSize(width, height, false);
		renderer.setClearColor(0x000000, 0);
		rendererRef.current = renderer;

		// OrbitControls
		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.zoomSpeed = 0.7;
		controls.rotateSpeed = 0.8;
		// Limitar a vista superior (evita ir por debajo del plano)
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI / 2.05;
		controlsRef.current = controls;

		// Restore previous camera state if exists
		const saved = getCameraState();
		if (saved) {
			camera.position.set(...saved.position);
			if (controls) {
				controls.target.set(...saved.target);
				controls.update();
			}
		}

		type GalaxyRuntime = {
			group: THREE.Group;
			center: THREE.Vector3;
			labelDiv: HTMLDivElement;
			radius: number;
		};

		// renamed runtime collection
		const runtimeGalaxies: GalaxyRuntime[] = [];

		let totalParticles = 0; // acumulador global

		const updateGalaxyVisibility = () => {
			const camPos = camera.position;
			runtimeGalaxies.forEach(g => {
				const dist = camPos.distanceTo(g.center);
				const visible = dist <= MAX_GALAXY_VIEW_DISTANCE;
				if (g.group.visible !== visible) {
					g.group.visible = visible;
					g.labelDiv.style.display = visible ? 'block' : 'none';
				}
			});
		};

		const createGalaxy = (cfg: GalaxyConfig) => {
			// no crear si excede presupuesto global
			const remaining = Math.max(0, GLOBAL_PARTICLE_BUDGET - totalParticles);
			if (remaining <= 0) return;

			// ajustar count si supera restante
			if (cfg.count > remaining) cfg.count = remaining;

			const positions = new Float32Array(cfg.count * 3);
			const colors = new Float32Array(cfg.count * 3);
			const colorInside = new THREE.Color(cfg.insideColor);
			const colorOutside = new THREE.Color(cfg.outsideColor);

			for (let i = 0; i < cfg.count; i++) {
				const i3 = i * 3;
				const branchAngle = ((i % cfg.branches) / cfg.branches) * Math.PI * 2;
				const radius = Math.pow(Math.random(), cfg.randomnessPower) * cfg.radius;
				const spin = radius * cfg.spin;

				const currentColor = colorInside.clone();
				currentColor.lerp(colorOutside, radius / cfg.radius);

				const randomX = Math.pow(Math.random(), cfg.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius * cfg.randomness;
				const randomY = Math.pow(Math.random(), cfg.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius * cfg.randomness * 0.4;
				const randomZ = Math.pow(Math.random(), cfg.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius * cfg.randomness;

				positions[i3] = Math.cos(branchAngle + spin) * radius + randomX;
				positions[i3 + 1] = randomY * 0.7;
				positions[i3 + 2] = Math.sin(branchAngle + spin) * radius + randomZ;

				colors[i3] = currentColor.r;
				colors[i3 + 1] = currentColor.g;
				colors[i3 + 2] = currentColor.b;
			}

			totalParticles += cfg.count;

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const matKey = `${cfg.insideColor}_${cfg.outsideColor}_${cfg.size}`;
			let material = pointsMaterialCache.get(matKey);
			if (!material) {
				material = new THREE.PointsMaterial({
					size: cfg.size,
					sizeAttenuation: true,
					depthWrite: false,
					blending: THREE.AdditiveBlending,
					transparent: true,
					opacity: 0.9,
					vertexColors: true
				});
				pointsMaterialCache.set(matKey, material);
			}

			const points = new THREE.Points(geometry, material);
			const group = new THREE.Group();
			group.add(points);
			group.position.copy(cfg.position);

			// ligera inclinación aleatoria
			group.rotation.set(
				Math.random() * 0.4 - 0.2,
				Math.random() * Math.PI * 2,
				Math.random() * 0.4 - 0.2
			);

			scene.add(group);

			// Label
			const div = document.createElement('div');
			div.textContent = cfg.label;
			const labelStyles: Partial<CSSStyleDeclaration> = {
				position: 'absolute',
				transform: 'translate(-50%, -50%)',
				color: '#fff',
				fontSize: '.7rem',
				fontWeight: '600',
				letterSpacing: '.5px',
				padding: '.35rem .65rem',
				borderRadius: '.6rem',
				background: 'linear-gradient(140deg, rgba(25,35,55,.55), rgba(10,15,25,.7))',
				backdropFilter: 'blur(6px) saturate(160%)',
				border: '1px solid rgba(255,255,255,0.12)',
				boxShadow: '0 2px 10px -4px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.05) inset',
				pointerEvents: 'none',
				whiteSpace: 'nowrap',
				userSelect: 'none',
				zIndex: '20'
			};
			Object.assign(div.style, labelStyles);
			labelLayer.appendChild(div);

			runtimeGalaxies.push({
				group,
				center: cfg.position.clone(),
				labelDiv: div,
				radius: cfg.radius
			});
			galaxyNodesRef.current[cfg.label] = { group, center: cfg.position.clone(), radius: cfg.radius };
		};

		// BUILD dynamic configs from prop galaxyLabels (not the runtime array)
		const dynamicConfigs: GalaxyConfig[] = (galaxyLabels || []).map((label, i) => {
			const pair = colorPairs[i % colorPairs.length];
			// ring layout (rough 12 per ring)
			const perRing = 12;
			const ring = Math.floor(i / perRing);
			const indexInRing = i % perRing;
			const ringRadius = 10 + ring * 10; // distance between rings
			const angle = ((indexInRing) / perRing) * Math.PI * 2;
			const pos = new THREE.Vector3(
				Math.cos(angle) * ringRadius,
				(Math.random() - 0.5) * 2.5,
				Math.sin(angle) * ringRadius
			);
			const articleCount = (galaxyArticles?.[label]?.length || 0);
			// nuevo cálculo: escala suave + límites
			const scaled = 1200 + Math.sqrt(articleCount) * 220;
			const baseCount = Math.min(MAX_PARTICLES_PER_GALAXY, Math.floor(scaled));
			return {
				label,
				count: baseCount,
				radius: 1.6 + Math.min(2.6, Math.sqrt(articleCount) * 0.22),
				branches: 5 + (i % 4),
				spin: 0.9 + (i % 3) * 0.15,
				randomness: 0.10 + (i % 5) * 0.01,
				randomnessPower: 2,
				insideColor: pair[0],
				outsideColor: pair[1],
				position: pos,
				size: 0.0105
			};
		});
		console.log('[Universe] Building galaxies from labels:', galaxyLabels.length);
		dynamicConfigs.forEach(cfg => createGalaxy(cfg));
		updateGalaxyVisibility(); // inicial

		type SunRuntime = {
			group: THREE.Group;
			core: THREE.Mesh;
			glow: THREE.Mesh;
			angle: number;
			orbitRadius: number;
			orbitSpeed: number;
			galaxyCenter: THREE.Vector3;
			tooltip: HTMLDivElement;
			article?: string;
		};

		const suns: SunRuntime[] = [];
		let hoveredSun: SunRuntime | null = null;
		let paused = false;
		let hoverRing: THREE.Mesh | null = null; // queda sin uso (no se creará ya)

		const sunLayer = document.createElement('div');
		Object.assign(sunLayer.style, {
			position: 'absolute',
			inset: '0',
			pointerEvents: 'none',
			zIndex: '25',
			fontFamily: 'inherit'
		});
		labelLayer.appendChild(sunLayer);

		const sunTooltipStyle = (): Partial<CSSStyleDeclaration> => ({
			position: 'absolute',
			transform: 'translate(-50%, -50%)',
			// estilos visuales movidos a clase .three-sun-tooltip
		});

		const createSunMesh = (coreCol: THREE.Color, glowCol: THREE.Color) => {
			const coreGeo = new THREE.SphereGeometry(sunParams.sunSize, 24, 24);
			const coreMat = new THREE.MeshStandardMaterial({
				color: coreCol,
				emissive: coreCol,
				emissiveIntensity: 0.9,
				roughness: 0.4,
				metalness: 0.05
			});
			const core = new THREE.Mesh(coreGeo, coreMat);

			const glowGeo = new THREE.SphereGeometry(sunParams.sunSize * sunParams.glowIntensity, 20, 20);
			const glowMat = new THREE.MeshBasicMaterial({
				color: glowCol,
				transparent: true,
				opacity: 0.14,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			});
			const glow = new THREE.Mesh(glowGeo, glowMat);
			return { core, glow };
		};

		const colorFromIndex = (i: number, total: number) => {
			const hue = (i / Math.max(total,1)) * 360;
			return new THREE.Color(`hsl(${hue},72%,55%)`);
		};

		const createSunsForGalaxy = (g: GalaxyRuntime) => {
			const articles = galaxyArticles[g.labelDiv.textContent || ''] || [];
			const total = articles.length;
			const golden = 2.39996323; // ángulo áureo para dispersión
			const radialMax = g.radius * 0.85;
			const base = g.radius * 0.22;
			const step = (radialMax - base) / Math.max(total, 1);

			articles.forEach((title, idx) => {
				const coreColor = colorFromIndex(idx, total);
				const glowColor = coreColor.clone().offsetHSL(0, -0.05, 0.1);
				const { core, glow } = createSunMesh(coreColor, glowColor);
				const group = new THREE.Group();
				group.add(core);
				group.add(glow);

				const orbitRadius = base + step * idx;
				const angle = idx * golden;
				group.position.set(
					g.center.x + Math.cos(angle) * orbitRadius,
					g.center.y + Math.sin(idx * 0.37) * 0.25,
					g.center.z + Math.sin(angle) * orbitRadius
				);

				scene.add(group);

				const tooltip = document.createElement('div');
				tooltip.className = 'three-sun-tooltip';
				Object.assign(tooltip.style, {
					position: 'absolute',
					transform: 'translate(-50%, -50%)',
					opacity: '0',
					transition: 'opacity .25s'
				});
				tooltip.innerHTML = `
					<span class="dim">${title}</span>
				`;
				sunLayer.appendChild(tooltip);

				suns.push({
					group,
					core,
					glow,
					angle,
					orbitRadius,
					orbitSpeed: sunParams.orbitSpeed * (0.6 + (idx % 5) * 0.15),
					galaxyCenter: g.center.clone(),
					tooltip,
					article: title
				});
			});
		};

		runtimeGalaxies.forEach(g => createSunsForGalaxy(g));

		// Animación de enfoque de cámara
		let camAnimActive = false;
		let camFrom = new THREE.Vector3();
		let camTo = new THREE.Vector3();
		let targetFrom = new THREE.Vector3();
		let targetTo = new THREE.Vector3();
		let camAnimT = 0;

		const startCameraFocus = (center: THREE.Vector3, radius: number) => {
			const fovRad = THREE.MathUtils.degToRad(camera.fov);
			const radiusWithMargin = radius * 1.15;
			const aspect = (renderer.domElement.clientWidth || width) / (renderer.domElement.clientHeight || height);
			const neededDistHeight = radiusWithMargin / Math.tan(fovRad / 2);
			const neededDistWidth = radiusWithMargin / (Math.tan(fovRad / 2) * aspect);
			const neededDist = Math.max(neededDistHeight, neededDistWidth);
			camFrom.copy(camera.position);
			camTo.set(center.x, center.y + neededDist, center.z + 0.001); // leve offset z
			targetFrom.copy(controls.target);
			targetTo.copy(center);
			camAnimT = 0;
			camAnimActive = true;
		};
		focusGalaxyRef.current = (center, radius) => startCameraFocus(center, radius);

		// Picking
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		raycaster.params.Points = { threshold: 0.05 }; // hit box reducido

		const handleClick = (evt: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);

			// 1) Intentar seleccionar un sol
			const sunCores = suns.map(s => s.core);
			const sunHits = raycaster.intersectObjects(sunCores, false);
			if (sunHits.length) {
				const obj = sunHits[0].object as THREE.Mesh;
				const sunIdx = suns.findIndex(s => s.core === obj);
				if (sunIdx >= 0 && suns[sunIdx]) {
					const gLabel = runtimeGalaxies.find(g => g.center.distanceTo(suns[sunIdx].galaxyCenter) < g.radius + 0.01)?.labelDiv.textContent || 'Tema';
					if (hoverRing) {
						scene.remove(hoverRing);
						hoverRing.geometry.dispose();
						(hoverRing.material as THREE.Material).dispose();
						hoverRing = null;
					}
					if (typeof (onSunSelect) === 'function') {
						onSunSelect({ galaxy: gLabel, sunIndex: sunIdx, article: suns[sunIdx].article });
					}
					return;
				}
			}

			// 2) Fallback: click galaxia (mantener comportamiento previo)
			const pointObjects: THREE.Object3D[] = [];
			runtimeGalaxies.forEach(g => {
				g.group.traverse(o => {
					if ((o as THREE.Points).isPoints) pointObjects.push(o);
				});
			});
			const intersects = raycaster.intersectObjects(pointObjects, false);
			if (intersects.length) {
				for (const inter of intersects) {
					const pts = inter.object as THREE.Points;
					const g = runtimeGalaxies.find(gl => gl.group.children.includes(pts));
					if (!g) continue;
					if (inter.point.distanceTo(g.center) > g.radius * 0.7) continue;
					startCameraFocus(g.center, g.radius);
					break;
				}
			}
		};
		canvas.addEventListener('pointerdown', handleClick);

		const handlePointerMove = (evt: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);

			const sunCores = suns.map(s => s.core);
			const intersects = raycaster.intersectObjects(sunCores, false);

			if (intersects.length) {
				const obj = intersects[0].object as THREE.Mesh;
				const sun = suns.find(s => s.core === obj);
				if (sun && hoveredSun !== sun) {
					if (hoveredSun) hoveredSun.tooltip.style.opacity = '0';
					hoveredSun = sun;
					sun.tooltip.style.opacity = '1';
				}
			} else {
				if (hoveredSun) hoveredSun.tooltip.style.opacity = '0';
				hoveredSun = null;
			}
		};
		canvas.addEventListener('pointermove', handlePointerMove);

		const clock = new THREE.Clock();

		// throttle labels
		let frameCount = 0;
		const updateLabels = () => {
			frameCount++;
			if (frameCount % LABEL_UPDATE_SKIP !== 0) return;
			if (!camera) return;
			const width = container.clientWidth;
			const height = container.clientHeight;
			for (const g of runtimeGalaxies) {
				if (!g.group.visible) continue; // skip ocultas
				const screenPos = g.center.clone().project(camera);
				// Ocultar si detrás
				if (screenPos.z > 1) {
					g.labelDiv.style.display = 'none';
					continue;
				}
				g.labelDiv.style.display = 'block';
				const x = (screenPos.x * 0.5 + 0.5) * width;
				const y = (-screenPos.y * 0.5 + 0.5) * height;
				g.labelDiv.style.left = `${x}px`;
				g.labelDiv.style.top = `${y}px`;
				// Escalado según distancia (más lejos -> más pequeño)
				const dist = camera.position.distanceTo(g.center);
				// base: a partir de 15 empieza a reducir
				let scale = 1;
				const threshold = 15;
				if (dist > threshold) {
					scale = Math.max(0.35, threshold / dist);
				}
				g.labelDiv.style.transform = `translate(-50%, -50%) scale(${scale})`;
				g.labelDiv.style.opacity = scale < 0.5 ? `${0.6 + (scale - 0.35)}` : '1';
				for (const s of suns) {
					const screenPos = s.group.position.clone().project(camera);
					if (screenPos.z > 1) {
						s.tooltip.style.display = 'none';
						continue;
					}
					s.tooltip.style.display = 'block';
					const x = (screenPos.x * 0.5 + 0.5) * width;
					const y = (-screenPos.y * 0.5 + 0.5) * height;
					s.tooltip.style.left = `${x}px`;
					s.tooltip.style.top = `${y - 18}px`;
					if (s !== hoveredSun && s.tooltip.style.opacity === '1') {
						s.tooltip.style.opacity = '0';
						s.tooltip.classList.remove('active');
					}
				}
			}
		};

		const tick = () => {
			if (autoRotate && !paused) {
				const galaxyRotationSpeed = 0.0012;
				runtimeGalaxies.forEach(g => { g.group.rotation.y += galaxyRotationSpeed; });
			}
			if (camAnimActive) {
				camAnimT += 0.025;
				const t = camAnimT >= 1 ? 1 : camAnimT;
				const eased = t * (2 - t);
				camera.position.lerpVectors(camFrom, camTo, eased);
				controls.target.lerpVectors(targetFrom, targetTo, eased);
				if (t === 1) camAnimActive = false;
			}
			if (autoRotate) {
				const galaxyRotationSpeed = 0.0012;
				suns.forEach(s => {
					s.angle += s.orbitSpeed * 0.002 * sunParams.orbitSpeed;
					s.group.position.set(
						s.galaxyCenter.x + Math.cos(s.angle) * s.orbitRadius,
						s.galaxyCenter.y + Math.sin(s.angle * 0.3) * 0.3,
						s.galaxyCenter.z + Math.sin(s.angle) * s.orbitRadius
					);
					s.core.rotation.y += galaxyRotationSpeed;
				});
			}
			updateGalaxyVisibility(); // culling cada frame (barato)
			controls.update();
			updateLabels();
			renderer.render(scene, camera);
			animationIdRef.current = requestAnimationFrame(tick);
		};
		tick();

		// ResizeObserver
		const ro = new ResizeObserver(entries => {
			for (const entry of entries) {
				const w = entry.contentRect.width || 1;
				const h = entry.contentRect.height || 1;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h, false);
			}
		});
		ro.observe(container);

		const onWindowResize = () => {
			const w = container.clientWidth || window.innerWidth;
			const h = container.clientHeight || window.innerHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		};
		window.addEventListener('resize', onWindowResize);

		// omitir GUI si demasiadas galaxias
		if (!sunGUI && galaxyLabels.length <= 25) {
			sunGUI = new dat.GUI();
			sunGUI.domElement.style.zIndex = '45';
			sunGUI.domElement.style.position = 'fixed';
			sunGUI.domElement.style.bottom = '8px';
			sunGUI.domElement.style.left = '8px';
		}
		// ...existing code sunFolderAdded block (proteger con sunGUI)...
		if (sunGUI && !sunFolderAdded && galaxyLabels.length <= 25) {
			const sf = sunGUI.addFolder('suns');
			sf.add(sunParams, 'sunSize').min(0.1).max(1).step(0.01).onFinishChange(() => {
				suns.forEach(s => {
					s.core.geometry.dispose();
					s.glow.geometry.dispose();
				});
			});
			sf.add(sunParams, 'glowIntensity').min(1).max(3).step(0.05).onFinishChange(() => { // max ajustado (antes 4)
				suns.forEach(s => {
					s.glow.geometry.dispose();
					s.glow.geometry = new THREE.SphereGeometry(sunParams.sunSize * sunParams.glowIntensity, 28, 28);
				});
			});
			sf.add(sunParams, 'orbitSpeed').min(0).max(2).step(0.01);
			sf.add(sunParams, 'rotationSpeed').min(0).max(3).step(0.05);
			sf.addColor(sunParams, 'coreColor').onFinishChange(() => {
				suns.forEach(s => {
					(s.core.material as THREE.MeshStandardMaterial).color.set(sunParams.coreColor);
					(s.core.material as THREE.MeshStandardMaterial).emissive.set(sunParams.coreColor);
				});
			});
			sf.addColor(sunParams, 'glowColor').onFinishChange(() => {
				suns.forEach(s => {
					(s.glow.material as THREE.MeshBasicMaterial).color.set(sunParams.glowColor);
				});
			});
			sf.open();
			sunFolderAdded = true;
		}

		return () => {
			if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
			window.removeEventListener('resize', onWindowResize);
			ro.disconnect();
			canvas.removeEventListener('pointerdown', handleClick);
			canvas.removeEventListener('pointermove', handlePointerMove);
			runtimeGalaxies.forEach(g => {
				g.group.traverse(obj => {
					if ((obj as THREE.Points).isPoints) {
						const pts = obj as THREE.Points;
						pts.geometry.dispose();
						(pts.material as THREE.PointsMaterial).dispose();
					}
				});
				scene.remove(g.group);
				if (g.labelDiv.parentNode) g.labelDiv.parentNode.removeChild(g.labelDiv);
			});
			suns.forEach(s => {
				s.core.geometry.dispose();
				(s.core.material as THREE.Material).dispose();
				s.glow.geometry.dispose();
				(s.glow.material as THREE.Material).dispose();
				if (s.tooltip.parentNode) s.tooltip.parentNode.removeChild(s.tooltip);
				scene.remove(s.group);
			});
			if (hoverRing) {
				scene.remove(hoverRing);
				hoverRing.geometry.dispose();
				(hoverRing.material as THREE.Material).dispose();
				hoverRing = null;
			}
			renderer.dispose();
			if (controls) {
				setCameraState({
					position: [camera.position.x, camera.position.y, camera.position.z],
					target: [controls.target.x, controls.target.y, controls.target.z]
				});
			} else {
				setCameraState({
					position: [camera.position.x, camera.position.y, camera.position.z],
					target: [0, 0, 0]
				});
			}
		};
	}, [autoRotate, background, onSunSelect, galaxyArticles, galaxyLabels]); // updated dependency

	useImperativeHandle(ref, () => ({
		focusGalaxy: (name: string) => {
			const entry = galaxyNodesRef.current[name];
			if (!entry) return;
			focusGalaxyRef.current(entry.center, entry.radius);
		}
	}), []);

	return (
		<div ref={containerRef} className="three-sun" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
			<canvas
				ref={canvasRef}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					display: 'block',
					zIndex: 5,
					outline: 'none',
					cursor: 'grab',
					pointerEvents: 'auto' // override global
				}}
			/>
			<div
				ref={labelLayerRef}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					fontFamily: 'inherit',
					zIndex: 10
				}}
			/>
		</div>
	);
});

export default Universe;
