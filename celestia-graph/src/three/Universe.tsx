import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface UniverseProps {
	autoRotate?: boolean;
	background?: string;
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

const Universe: React.FC<UniverseProps> = ({ autoRotate = true, background = 'transparent' }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const animationIdRef = useRef<number | null>(null);
	const labelLayerRef = useRef<HTMLDivElement | null>(null);

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
		};

		galaxyConfigs.forEach(cfg => createGalaxy(cfg));

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

		// Picking
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		raycaster.params.Points = { threshold: 0.05 }; // hit box reducido

		const handleClick = (evt: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			// recolectar todos los Points
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
					// reducir área clicable: solo núcleo central
					if (inter.point.distanceTo(g.center) > g.radius * 0.7) continue;
					startCameraFocus(g.center, g.radius);
					break;
				}
			}
		};
		canvas.addEventListener('pointerdown', handleClick);

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
			}
		};

		const tick = () => {
			const elapsed = clock.getElapsedTime();
			if (autoRotate) {
				galaxies.forEach((g, idx) => {
					g.group.rotation.y += 0.0008 + idx * 0.00015;
					g.group.rotation.x += 0.00015;
				});
			}
			// Animación de cámara
			if (camAnimActive) {
				camAnimT += 0.025;
				const t = camAnimT >= 1 ? 1 : camAnimT;
				// easeOutQuad
				const eased = t * (2 - t);
				camera.position.lerpVectors(camFrom, camTo, eased);
				controls.target.lerpVectors(targetFrom, targetTo, eased);
				if (t === 1) camAnimActive = false;
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

		return () => {
			if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
			window.removeEventListener('resize', onWindowResize);
			ro.disconnect();
			canvas.removeEventListener('pointerdown', handleClick);
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
			renderer.dispose();
		};
	}, [autoRotate, background]);

	return (
		<div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
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
					cursor: 'grab'
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
};

export default Universe;
