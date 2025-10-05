import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { setCameraState, getCameraState } from '../state/cameraStore';

interface UniverseProps {
	autoRotate?: boolean;
	background?: string;
	onSunSelect?: (data: { galaxy: string; sunIndex: number }) => void;
	galaxies?: string[];
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

const galaxyConfigs: GalaxyConfig[] = [
	{
		label: 'Tema: A',
		count: 7000,
		radius: 2.2,
		branches: 6,
		spin: 1,
		randomness: 0.14,
		randomnessPower: 2,
		insideColor: 0xffd66b,
		outsideColor: 0xeb4d2d,
		position: new THREE.Vector3(-9, 0, -3),
		size: 0.012,
	},
	{
		label: 'Tema: B',
		count: 9000,
		radius: 2.8,
		branches: 5,
		spin: 1.2,
		randomness: 0.1,
		randomnessPower: 3,
		insideColor: 0x73d7ff,
		outsideColor: 0x264bff,
		position: new THREE.Vector3(0, 2, 4),
		size: 0.011,
	},
	{
		label: 'Tema: C',
		count: 6000,
		radius: 1.9,
		branches: 8,
		spin: 0.8,
		randomness: 0.16,
		randomnessPower: 2,
		insideColor: 0xe4b1ff,
		outsideColor: 0x6f2fb8,
		position: new THREE.Vector3(7.5, -1.2, -2),
		size: 0.013,
	},
	{
		label: 'Tema: D',
		count: 7500,
		radius: 2.4,
		branches: 7,
		spin: 1.4,
		randomness: 0.11,
		randomnessPower: 2,
		insideColor: 0xa6ff9e,
		outsideColor: 0x1d7f38,
		position: new THREE.Vector3(-4, -2.2, 6),
		size: 0.012,
	},
	{
		label: 'Tema: E',
		count: 8500,
		radius: 3,
		branches: 5,
		spin: 1.1,
		randomness: 0.12,
		randomnessPower: 3,
		insideColor: 0xffffff,
		outsideColor: 0x657bff,
		position: new THREE.Vector3(5, 3, 5),
		size: 0.0105,
	},
];

interface SunParams {
	sunSize: number;
	glowIntensity: number;
	orbitSpeed: number;
	rotationSpeed: number;
	coreColor: number;
	glowColor: number;
}

const sunParams: SunParams = {
	sunSize: 0.18, // antes 0.35
	glowIntensity: 1.45, // reducido (antes 2.2)
	orbitSpeed: 0.4,
	rotationSpeed: 0.8,
	coreColor: 0xffd277,
	glowColor: 0xffaa33,
};

let sunGUI: dat.GUI | null = null;
let sunFolderAdded = false;

const Universe = forwardRef<UniverseRef, UniverseProps>(({
	autoRotate = true,
	background = 'transparent',
	onSunSelect,
	galaxies = ['Tema A', 'Tema B'],
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
		scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.035);

		// Cámara
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || window.innerHeight;
		const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 200);
		// Vista cenital inicial
		camera.position.set(0, 28, 0.01);
		camera.lookAt(0, 0, 0);
		scene.add(camera);
		cameraRef.current = camera;

		// Luz tenue (para posible futura adición de elementos)
		const hemi = new THREE.HemisphereLight(0x6688ff, 0x080820, 0.6);
		scene.add(hemi);

		// Renderer
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

		const galaxies: GalaxyRuntime[] = [];

		const createGalaxy = (cfg: GalaxyConfig) => {
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

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const material = new THREE.PointsMaterial({
				size: cfg.size,
				sizeAttenuation: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				transparent: true,
				opacity: 0.95,
				vertexColors: true,
			});

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

			galaxies.push({
				group,
				center: cfg.position.clone(),
				labelDiv: div,
				radius: cfg.radius
				});
			galaxyNodesRef.current[cfg.label] = { group, center: cfg.position.clone(), radius: cfg.radius };
		};

		galaxyConfigs.forEach(cfg => createGalaxy(cfg));

		type SunRuntime = {
			group: THREE.Group;
			core: THREE.Mesh;
			glow: THREE.Mesh;
			angle: number;
			orbitRadius: number;
			orbitSpeed: number;
			galaxyCenter: THREE.Vector3;
			tooltip: HTMLDivElement;
		};

		const suns: SunRuntime[] = [];
		let hoveredSun: SunRuntime | null = null;
		let paused = false;
		let hoverRing: THREE.Mesh | null = null; // anillo decorativo

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

		const createSunMesh = () => {
			const coreGeo = new THREE.SphereGeometry(sunParams.sunSize, 28, 28);
			const coreMat = new THREE.MeshStandardMaterial({
				color: sunParams.coreColor,
				emissive: sunParams.coreColor,
				emissiveIntensity: 1.1,
				roughness: 0.3,
				metalness: 0.05
			});
			const core = new THREE.Mesh(coreGeo, coreMat);

			const glowGeo = new THREE.SphereGeometry(sunParams.sunSize * sunParams.glowIntensity, 28, 28);
			const glowMat = new THREE.MeshBasicMaterial({
				color: sunParams.glowColor,
				transparent: true,
				opacity: 0.18,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			});
			const glow = new THREE.Mesh(glowGeo, glowMat);
			return { core, glow };
		};

		const createSunsForGalaxy = (g: GalaxyRuntime) => {
			const count = Math.floor(Math.random() * 8) + 3; // 3-10
			for (let i = 0; i < count; i++) {
				const { core, glow } = createSunMesh();
				const group = new THREE.Group();
				group.add(core);
				group.add(glow);

				// Nuevo: órbita estrictamente dentro del radio de la galaxia
				const orbitRadius = g.radius * (0.15 + Math.random() * 0.75); // entre 15% y 90% del radio
				const angle = Math.random() * Math.PI * 2;
				group.position.set(
					g.center.x + Math.cos(angle) * orbitRadius,
					g.center.y + (Math.random() * 0.3 - 0.15) * (g.radius * 0.25),
					g.center.z + Math.sin(angle) * orbitRadius
				);

				scene.add(group);

				const tooltip = document.createElement('div');
				tooltip.className = 'three-sun-tooltip';
				Object.assign(tooltip.style, sunTooltipStyle());
				tooltip.innerHTML = `
					<strong>${g.labelDiv.textContent || 'SUN'}</strong><br/>
					<span class="meta">Sol #${i + 1}</span><br/>
					<span class="dim">Orbit: ${orbitRadius.toFixed(2)}</span>
				`;
				sunLayer.appendChild(tooltip);

				suns.push({
					group,
					core,
					glow,
					angle,
					orbitRadius,
					orbitSpeed: sunParams.orbitSpeed * (0.4 + Math.random() * 0.9),
					galaxyCenter: g.center.clone(),
					tooltip
				});
			}
		};

		galaxies.forEach(g => createSunsForGalaxy(g));

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
					const gLabel = galaxies.find(g => g.center.distanceTo(suns[sunIdx].galaxyCenter) < g.radius + 0.01)?.labelDiv.textContent || 'Tema';
					if (hoverRing) {
						scene.remove(hoverRing);
						hoverRing.geometry.dispose();
						(hoverRing.material as THREE.Material).dispose();
						hoverRing = null;
					}
					if (typeof (onSunSelect) === 'function') {
						onSunSelect({ galaxy: gLabel, sunIndex: sunIdx });
					}
					return;
				}
			}

			// 2) Fallback: click galaxia (mantener comportamiento previo)
			const pointObjects: THREE.Object3D[] = [];
			galaxies.forEach(g => {
				g.group.traverse(o => {
					if ((o as THREE.Points).isPoints) pointObjects.push(o);
				});
			});
			const intersects = raycaster.intersectObjects(pointObjects, false);
			if (intersects.length) {
				for (const inter of intersects) {
					const pts = inter.object as THREE.Points;
					const g = galaxies.find(gl => gl.group.children.includes(pts));
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
				if (sun) {
					if (hoveredSun !== sun) {
						if (hoveredSun) {
							hoveredSun.tooltip.style.opacity = '0';
							hoveredSun.tooltip.classList.remove('active');
							hoveredSun.tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
						}
						hoveredSun = sun;
						paused = true;
						sun.tooltip.style.opacity = '1';
						sun.tooltip.classList.add('active');
						sun.tooltip.style.transform = 'translate(-50%, -50%) scale(1.1)';
						// crear anillo si no existe
						if (!hoverRing) {
							const ringGeo = new THREE.RingGeometry(sunParams.sunSize * 1.6, sunParams.sunSize * 2.1, 64);
							const ringMat = new THREE.MeshBasicMaterial({
								color: 0xffd665,
								transparent: true,
								opacity: 0.55,
								side: THREE.DoubleSide,
								blending: THREE.AdditiveBlending,
								depthWrite: false
							});
							hoverRing = new THREE.Mesh(ringGeo, ringMat);
							scene.add(hoverRing);
						}
						hoverRing.position.copy(sun.group.position);
					}
				}
			} else {
				if (hoveredSun) {
					hoveredSun.tooltip.style.opacity = '0';
					hoveredSun.tooltip.classList.remove('active');
					hoveredSun.tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
					hoveredSun = null;
				}
				if (hoverRing) {
					scene.remove(hoverRing);
					hoverRing.geometry.dispose();
					(hoverRing.material as THREE.Material).dispose();
					hoverRing = null;
				}
				paused = false;
			}
		};
		canvas.addEventListener('pointermove', handlePointerMove);

		const clock = new THREE.Clock();

		const updateLabels = () => {
			if (!camera) return;
			const width = container.clientWidth;
			const height = container.clientHeight;
			for (const g of galaxies) {
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
			const elapsed = clock.getElapsedTime();
			if (autoRotate && !paused) { // añadido !paused
				// Rotación unificada (misma dirección/velocidad para todas)
				const galaxyRotationSpeed = 0.0012;
				galaxies.forEach(g => {
					g.group.rotation.y += galaxyRotationSpeed;
				});
			}
			// Animación de cámara
			if (camAnimActive) {
				camAnimT += 0.025;
				const t = camAnimT >= 1 ? 1 : camAnimT;
				const eased = t * (2 - t);
				camera.position.lerpVectors(camFrom, camTo, eased);
				controls.target.lerpVectors(targetFrom, targetTo, eased);
				if (t === 1) camAnimActive = false;
			}
			if (!paused && autoRotate) {
				// usar misma velocidad/dirección para la rotación propia de los soles
				const galaxyRotationSpeed = 0.0012;
				suns.forEach(s => {
					s.angle += s.orbitSpeed * 0.002 * sunParams.orbitSpeed;
					s.group.position.set(
						s.galaxyCenter.x + Math.cos(s.angle) * s.orbitRadius,
						s.galaxyCenter.y + Math.sin(s.angle * 0.35) * 0.4,
						s.galaxyCenter.z + Math.sin(s.angle) * s.orbitRadius
					);
					s.core.rotation.y += galaxyRotationSpeed;
					s.glow.rotation.y += galaxyRotationSpeed;
				});
			}
			// Efectos dinámicos de hover
			if (hoveredSun) {
				const t = performance.now() * 0.001;
				if (hoverRing) {
					const pulse = 1 + Math.sin(t * 4) * 0.12;
					hoverRing.scale.setScalar(pulse);
					(hoverRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + (Math.sin(t * 6) * 0.25 + 0.25);
					hoverRing.lookAt(camera.position);
				}
				// pulso del glow
				const glowMat = hoveredSun.glow.material as THREE.MeshBasicMaterial;
				glowMat.opacity = 0.28 + (Math.sin(t * 5) * 0.1 + 0.1);
				hoveredSun.core.rotation.y += 0.0012; // misma velocidad que galaxia
			}
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

		if (!sunGUI) {
			sunGUI = new dat.GUI();
			sunGUI.domElement.style.zIndex = '45';
			sunGUI.domElement.style.position = 'fixed';
			sunGUI.domElement.style.bottom = '8px';
			sunGUI.domElement.style.left = '8px';
		}
		if (!sunFolderAdded) {
			const sf = sunGUI.addFolder('suns');
			sf.add(sunParams, 'sunSize').min(0.1).max(1).step(0.01).onFinishChange(() => {
				suns.forEach(s => {
					s.core.geometry.dispose();
					s.glow.geometry.dispose();
					const { core, glow } = createSunMesh();
					s.group.remove(s.core, s.glow);
					s.core = core;
					s.glow = glow;
					s.group.add(core, glow);
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
			galaxies.forEach(g => {
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
	}, [autoRotate, background, onSunSelect]);

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
