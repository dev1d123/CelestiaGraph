import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SunProps {
	background?: string;
	autoRotate?: boolean;
	title?: string;
	pmcId?: string | null;
}

interface SunParameters {
	size: number;
	color: number;
	glowColor: number;
	glowIntensity: number;
	rotationSpeed: number;
}

const params: SunParameters = {
	size: 1,
	color: 0xffcc55,
	glowColor: 0xffaa33,
	glowIntensity: 1.85,
	rotationSpeed: 0.4,
};

let gui: dat.GUI | null = null;
let folderAdded = false;

const Sun: React.FC<SunProps> = ({ background = 'transparent', autoRotate = true, title = 'Artículo', pmcId }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const coreRef = useRef<THREE.Mesh | null>(null);
	const glowRef = useRef<THREE.Mesh | null>(null);
	const animIdRef = useRef<number | null>(null);
	const [hovering, setHovering] = useState(false);
	const [tipPos, setTipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		const scene = new THREE.Scene();
		if (background !== 'transparent') scene.background = new THREE.Color(background);

		const camera = new THREE.PerspectiveCamera(
			55,
			container.clientWidth / container.clientHeight,
			0.1,
			50
		);
		camera.position.set(3, 2, 3);
		scene.add(camera);

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight, false);
		renderer.setClearColor(0x000000, 0);

		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;

		const buildSun = () => {
			if (coreRef.current) {
				scene.remove(coreRef.current);
				coreRef.current.geometry.dispose();
				(coreRef.current.material as THREE.Material).dispose();
				coreRef.current = null;
			}
			if (glowRef.current) {
				scene.remove(glowRef.current);
				glowRef.current.geometry.dispose();
				(glowRef.current.material as THREE.Material).dispose();
				glowRef.current = null;
			}

			const coreGeo = new THREE.SphereGeometry(params.size, 48, 48);
			const coreMat = new THREE.MeshStandardMaterial({
				color: params.color,
				emissive: params.color,
				emissiveIntensity: 1.1,
				roughness: 0.35,
				metalness: 0.1,
			});
			const core = new THREE.Mesh(coreGeo, coreMat);
			coreRef.current = core;
			scene.add(core);

			const glowGeo = new THREE.SphereGeometry(params.size * params.glowIntensity, 48, 48);
			const glowMat = new THREE.MeshBasicMaterial({
				color: params.glowColor,
				transparent: true,
				opacity: 0.18,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			});
			const glow = new THREE.Mesh(glowGeo, glowMat);
			glowRef.current = glow;
			scene.add(glow);

			// Luz puntual
			const light = new THREE.PointLight(params.color, 2.2, params.size * 25, 2);
			light.position.set(0, 0, 0);
			scene.add(light);
		};

		if (!gui) {
			gui = new dat.GUI();
			gui.domElement.style.zIndex = '40';
			gui.domElement.style.position = 'fixed';
			gui.domElement.style.top = '8px';
			gui.domElement.style.left = '8px';
		}
		if (!folderAdded) {
			const f = gui.addFolder('sun');
			f.add(params, 'size').min(0.2).max(3).step(0.01).onFinishChange(buildSun);
			f.add(params, 'glowIntensity').min(1).max(4).step(0.05).onFinishChange(buildSun);
			f.add(params, 'rotationSpeed').min(0).max(3).step(0.05);
			f.addColor(params, 'color').onFinishChange(buildSun);
			f.addColor(params, 'glowColor').onFinishChange(buildSun);
			f.open();
			folderAdded = true;
		}

		buildSun();

		const clock = new THREE.Clock();
		const tick = () => {
			const e = clock.getElapsedTime();
			if (autoRotate && coreRef.current && glowRef.current) {
				coreRef.current.rotation.y = e * params.rotationSpeed;
				glowRef.current.rotation.y = e * params.rotationSpeed * 0.5;
			}
			controls.update();
			renderer.render(scene, camera);
			animIdRef.current = requestAnimationFrame(tick);
		};
		tick();

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

		return () => {
			if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
			ro.disconnect();
			renderer.dispose();
		};
	}, [autoRotate, background]);

	return (
		<div
			ref={containerRef}
			style={{ position: 'absolute', inset: 0 }}
			onMouseMove={e => {
				if (!hovering) setHovering(true);
				setTipPos({ x: e.clientX + 14, y: e.clientY + 16 });
			}}
			onMouseLeave={() => setHovering(false)}
		>
			<canvas
				ref={canvasRef}
				style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
			/>

			{/* Panel fijo */}
			<div
				style={{
					position: 'absolute',
					top: '12px',
					right: '14px',
					background: 'rgba(15,25,40,.55)',
					backdropFilter: 'blur(8px)',
					border: '1px solid rgba(255,255,255,0.08)',
					padding: '.55rem .75rem .6rem',
					borderRadius: '.65rem',
					fontSize: '.6rem',
					letterSpacing: '.45px',
					color: '#fff',
					pointerEvents: 'none',
					maxWidth: 220,
					lineHeight: 1.25
				}}
			>
				<div style={{ fontWeight: 600, color: '#ffcf7b', marginBottom: 4 }}>Sun</div>
				<div style={{ opacity: .92 }}>{title}</div>
				<div style={{ marginTop: 6, fontSize: '.55rem', color: '#9fd4ff' }}>
					PMC: {pmcId || '—'}
				</div>
			</div>

			{/* Tooltip hover */}
			{hovering && (
				<div
					style={{
						position: 'fixed',
						left: tipPos.x,
						top: tipPos.y,
						zIndex: 100,
						background: 'rgba(10,18,30,0.82)',
						border: '1px solid rgba(255,255,255,0.14)',
						padding: '.55rem .65rem .6rem',
						borderRadius: '.6rem',
						fontSize: '.58rem',
						letterSpacing: '.45px',
						color: '#e9f4ff',
						maxWidth: 260,
						pointerEvents: 'none',
						boxShadow: '0 6px 18px -8px #000'
					}}
				>
					<div style={{ fontWeight: 600, marginBottom: 4, color: '#ffcf7b' }}>
						{title || 'Sin título'}
					</div>
					<div style={{ color: '#9bd2ff' }}>
						PMC: {pmcId || 'N/A'}
					</div>
				</div>
			)}
		</div>
	);
};

export default Sun;