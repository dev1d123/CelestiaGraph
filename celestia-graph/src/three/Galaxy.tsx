import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Tipos
interface GalaxyParameters {
	size: number;
	count: number;
	branches: number;
	radius: number;
	spin: number;
	randomness: number;
	randomnessPower: number;
	insideColor: number;
	outsideColor: number;
}
interface GalaxyProps {
	showAxes?: boolean;
	background?: string;
	autoRotate?: boolean;
	label?: string;
}

// Estado/config persistente fuera del componente (no se recrea en re-render)
const parameters: GalaxyParameters = {
	size: 0.01,
	count: 10000,
	branches: 10,
	radius: 3,
	spin: 1,
	randomness: 0.1,
	randomnessPower: 1,
	insideColor: 0xff6030,
	outsideColor: 0x391eb9,
};

let gui: dat.GUI | null = null;
let folderAdded = false;

// Componente
const Galaxy: React.FC<GalaxyProps> = ({ showAxes, background = 'transparent', autoRotate, label = 'Tema: waos' }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const pointsRef = useRef<THREE.Points | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const animationIdRef = useRef<number | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		// Escena
		const scene = new THREE.Scene();
		sceneRef.current = scene;

		if (showAxes) {
			scene.add(new THREE.AxesHelper(5));
		}
		if (background && background !== 'transparent') {
			scene.background = new THREE.Color(background);
		}

		// Cámara
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || window.innerHeight;

		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
		camera.position.set(3, 2, 3);
		scene.add(camera);
		cameraRef.current = camera;

		// Renderer
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height, false);
		renderer.setClearColor(0x000000, 0); // transparente sobre capas
		rendererRef.current = renderer;

		// Controles
		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controlsRef.current = controls;

		// Generador galaxia
		const generateGalaxy = () => {
			if (pointsRef.current) {
				scene.remove(pointsRef.current);
				pointsRef.current.geometry.dispose();
				(pointsRef.current.material as THREE.PointsMaterial).dispose();
				pointsRef.current = null;
			}

			const positions = new Float32Array(parameters.count * 3);
			const colors = new Float32Array(parameters.count * 3);
			const colorInside = new THREE.Color(parameters.insideColor);
			const colorOutside = new THREE.Color(parameters.outsideColor);

			for (let i = 0; i < parameters.count; i++) {
				const i3 = i * 3;
				const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
				const radius = Math.pow(Math.random(), parameters.randomnessPower) * parameters.radius;
				const spin = radius + parameters.spin;

				const currentColor = colorInside.clone();
				currentColor.lerp(colorOutside, radius / parameters.radius);

				const randPow = parameters.randomnessPower;
				const randFactor = parameters.randomness;

				const randomX = Math.pow(Math.random(), randPow) * (Math.random() < 0.5 ? 1 : -1) * radius * randFactor;
				const randomY = Math.pow(Math.random(), randPow) * (Math.random() < 0.5 ? 1 : -1) * radius * randFactor;
				const randomZ = Math.pow(Math.random(), randPow) * (Math.random() < 0.5 ? 1 : -1) * radius * randFactor;

				positions[i3] = Math.cos(branchAngle + spin) * radius + randomX;
				positions[i3 + 1] = randomY;
				positions[i3 + 2] = Math.sin(branchAngle + spin) * radius + randomZ;

				colors[i3] = currentColor.r;
				colors[i3 + 1] = currentColor.g;
				colors[i3 + 2] = currentColor.b;
			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const material = new THREE.PointsMaterial({
				size: parameters.size,
				sizeAttenuation: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				vertexColors: true,
			});

			const points = new THREE.Points(geometry, material);
			pointsRef.current = points;
			scene.add(points);
		};

		// GUI (solo una vez)
		if (!gui) {
			gui = new dat.GUI();
			gui.domElement.style.zIndex = '30';
			gui.domElement.style.position = 'fixed';
			gui.domElement.style.top = '8px';
			gui.domElement.style.right = '8px';
		}
		if (!folderAdded) {
			const galaxyFolder = gui.addFolder('galaxy');
			galaxyFolder.add(parameters, 'size').min(0).max(0.5).step(0.0001).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'spin').min(0).max(10).step(1).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'radius').min(1).max(10).step(1).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'branches').min(1).max(10).step(1).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'randomness').min(0).max(1).step(0.001).onFinishChange(generateGalaxy);
			galaxyFolder.add(parameters, 'randomnessPower').min(1).max(5).step(1).onFinishChange(generateGalaxy);
			galaxyFolder.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy);
			galaxyFolder.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy);
			galaxyFolder.open();
			folderAdded = true;
		}

		 // Siempre regenerar (aunque folderAdded ya exista)
		generateGalaxy();

		const clock = new THREE.Clock();

		const tick = () => {
			const elapsed = clock.getElapsedTime();
			if (autoRotate && pointsRef.current) {
				pointsRef.current.rotation.y = elapsed * 0.1;
			}
			controls.update();
			renderer.render(scene, camera);
			animationIdRef.current = requestAnimationFrame(tick);
		};
		tick();

		// ResizeObserver para tamaños dinámicos
		const ro = new ResizeObserver(entries => {
			for (const entry of entries) {
				const w = entry.contentRect.width;
				const h = entry.contentRect.height || 1;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h, false);
			}
		});
		ro.observe(container);

		const handleResize = () => {
			const w = container.clientWidth || window.innerWidth;
			const h = container.clientHeight || window.innerHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		};
		window.addEventListener('resize', handleResize);

		return () => {
			if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
			window.removeEventListener('resize', handleResize);
			if (scene && pointsRef.current) {
				scene.remove(pointsRef.current);
				pointsRef.current.geometry.dispose();
				(pointsRef.current.material as THREE.PointsMaterial).dispose();
				pointsRef.current = null;
			}
			controls.dispose();
			renderer.dispose();
			ro.disconnect();
		};
	}, [showAxes, background, autoRotate]);

	return (
		<div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
			<canvas
				ref={canvasRef}
				className="webgl"
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
					position: 'absolute',
					inset: 0,
					zIndex: 5  // sobre capas de fondo
				}}
				/>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 10,
					pointerEvents: 'none',
					// fontFamily eliminado para usar la fuente root
					fontSize: '.85rem', // antes 1.15rem
					fontWeight: 600,
					letterSpacing: '.5px',
					color: '#fff',
					padding: '.6rem 1rem', // reducido
					borderRadius: '0.85rem',
					background: 'linear-gradient(145deg, rgba(20,30,50,.55), rgba(10,15,25,.65))',
					backdropFilter: 'blur(8px) saturate(160%)',
					WebkitBackdropFilter: 'blur(8px) saturate(160%)',
					border: '1px solid rgba(255,255,255,0.12)',
					boxShadow: '0 4px 14px -6px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset',
					textShadow: '0 2px 6px rgba(0,0,0,0.55)'
				}}
			>
				{label}
			</div>
		</div>
	);
};

export default Galaxy;
