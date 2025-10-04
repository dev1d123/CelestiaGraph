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
}

// Estado/config persistente fuera del componente (no se recrea en re-render)
const parameters: GalaxyParameters = {
	size: 0.01,
	count: 100000,
	branches: 8,
	radius: 5,
	spin: 1,
	randomness: 0.1,
	randomnessPower: 3,
	insideColor: 0xff6030,
	outsideColor: 0x391eb9,
};

let gui: dat.GUI | null = null;
let folderAdded = false;

// Componente
const Galaxy: React.FC<GalaxyProps> = ({ showAxes, background = '#000000', autoRotate }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const pointsRef = useRef<THREE.Points | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const animationIdRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Escena
		const scene = new THREE.Scene();
		sceneRef.current = scene;

		if (showAxes) {
			scene.add(new THREE.AxesHelper(5));
		}
		if (background) {
			scene.background = new THREE.Color(background);
		}

		// Cámara
		const camera = new THREE.PerspectiveCamera(
			75,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			100
		);
		camera.position.set(3, 2, 3);
		scene.add(camera);
		cameraRef.current = camera;

		// Renderer
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
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
		if (!gui) gui = new dat.GUI();
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

		// Inicial
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

		const handleResize = () => {
			if (!canvas) return;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
		};
	}, [showAxes, background, autoRotate]);

	return (
		<canvas
			ref={canvasRef}
			className="webgl"
			style={{ width: '100%', height: '100%', display: 'block', background }}
		/>
	);
};

export default Galaxy;
