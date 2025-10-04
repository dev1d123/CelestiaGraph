import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const MiniChart3D: React.FC<{ data: number[] }> = ({ data }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const barsRef = useRef<THREE.Mesh[]>([]);
	const animRef = useRef<number | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 50);
		camera.position.set(4, 4.2, 6);
		camera.lookAt(0, 0, 0);

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(container.clientWidth, container.clientHeight, false);

		const ambient = new THREE.AmbientLight(0xffffff, 0.8);
		scene.add(ambient);
		const dir = new THREE.DirectionalLight(0xffffff, 0.6);
		dir.position.set(3, 5, 4);
		scene.add(dir);

		const group = new THREE.Group();
		scene.add(group);

		const gap = 0.6;
		data.forEach((v, i) => {
			const h = v * 0.07;
			const geo = new THREE.BoxGeometry(0.4, h, 0.4);
			const mat = new THREE.MeshStandardMaterial({
				color: new THREE.Color().setHSL(0.08 + i / data.length * 0.5, 0.65, 0.55),
				emissive: 0x111111,
				metalness: 0.35,
				roughness: 0.4
			});
			const m = new THREE.Mesh(geo, mat);
			m.position.set((i - data.length / 2) * gap, h / 2, 0);
			group.add(m);
			barsRef.current.push(m);
		});

		const baseGeo = new THREE.PlaneGeometry(8, 4, 32, 16);
		const baseMat = new THREE.MeshBasicMaterial({
			color: 0x112030,
			wireframe: true,
			transparent: true,
			opacity: 0.35
		});
		const base = new THREE.Mesh(baseGeo, baseMat);
		base.rotation.x = -Math.PI / 2;
		base.position.y = 0;
		scene.add(base);

		const clock = new THREE.Clock();
		const tick = () => {
			const t = clock.getElapsedTime();
			group.rotation.y = t * 0.25;
			barsRef.current.forEach((b, i) => {
				b.scale.y = 0.9 + Math.sin(t * 1.5 + i) * 0.15;
			});
			renderer.render(scene, camera);
			animRef.current = requestAnimationFrame(tick);
		};
		tick();

		const ro = new ResizeObserver(entries => {
			for (const e of entries) {
				const w = e.contentRect.width;
				const h = e.contentRect.height || 1;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h, false);
			}
		});
		ro.observe(container);

		return () => {
			if (animRef.current) cancelAnimationFrame(animRef.current);
			ro.disconnect();
			renderer.dispose();
		};
	}, [data]);

	return <div ref={containerRef} style={{position:'absolute', inset:0}}>
		<canvas ref={canvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%'}} />
	</div>;
};

export default MiniChart3D;
