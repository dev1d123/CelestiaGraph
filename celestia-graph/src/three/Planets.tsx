import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';

interface PlanetsProps {
	sunLabel: string;
	depth: number;
}

interface DagNodeData {
	id: string;
	level: number;
	label: string;
}

interface DagLinkData {
	source: string;
	target: string;
}

const Planets: React.FC<PlanetsProps> = ({ sunLabel, depth }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const graphRef = useRef<any>(null);
	const [tooltip, setTooltip] = useState<{x:number;y:number;label:string}|null>(null);

	function buildGraphData(d: number) {
		const nodes: DagNodeData[] = [];
		const links: DagLinkData[] = [];
		nodes.push({ id: 'root', level: 0, label: sunLabel });
		let prevLevelIds = ['root'];
		for (let lv = 1; lv <= d; lv++) {
			const count = Math.min(6 + lv * 2, 24);
			const levelIds: string[] = [];
			for (let i = 0; i < count; i++) {
				const id = `L${lv}-N${i}`;
				nodes.push({ id, level: lv, label: id });
				levelIds.push(id);
				// 1–2 random parents
				const parentCount = 1 + (Math.random() < 0.35 ? 1 : 0);
				for (let k = 0; k < parentCount; k++) {
					const parent = prevLevelIds[Math.floor(Math.random() * prevLevelIds.length)];
					links.push({ source: parent, target: id });
				}
			}
			prevLevelIds = levelIds;
		}
		return { nodes, links };
	}

	// init
	useEffect(() => {
		if (!containerRef.current) return;
		const ForceGraphConstructor = ForceGraph3D({
			controlType: 'orbit'
		});
		const fg = new ForceGraphConstructor(containerRef.current);
		graphRef.current = fg;

		// Lights tweak
		const scene = fg.scene();
		scene.add(new THREE.AmbientLight(0x6688aa, 0.9));
		const dl = new THREE.DirectionalLight(0xffffff, 0.6);
		dl.position.set(5, 8, 6);
		scene.add(dl);

		// Camera start
		const cam = fg.camera();
		cam.position.set(9, 6, 11);

		fg.backgroundColor('rgba(0,0,0,0)');
		fg.showNavInfo(false);
		fg.enableNodeDrag(true); // permitir arrastre
		fg.d3VelocityDecay(0.3);

		fg.nodeRelSize(4);

		fg.nodeThreeObject((node: DagNodeData) => {
			const baseColor = new THREE.Color()
				.setHSL(0.58 + node.level * 0.07, 0.55, 0.55);
			const radius = 1.1 * Math.pow(0.9, node.level); // nodos más grandes
			const geo = new THREE.SphereGeometry(radius, 28, 28);
			const mat = new THREE.MeshStandardMaterial({
				color: baseColor,
				emissive: baseColor.clone().multiplyScalar(node.level === 0 ? 0.6 : 0.22),
				metalness: 0.3,
				roughness: 0.38
			});
			const mesh = new THREE.Mesh(geo, mat);
			mesh.userData.emissiveBase = mat.emissive.clone();
			mesh.userData.baseScale = 1;        // escala base dinámica
			mesh.userData.dragging = false;     // flag arrastre
			mesh.userData.dragEase = 0;         // easing back
			if (node.level === 0) {
				const haloGeo = new THREE.SphereGeometry(radius * 1.5, 32, 32);
				const haloMat = new THREE.MeshBasicMaterial({
					color: 0x6fa8ff,
					opacity: 0.15,
					transparent: true,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				});
				const halo = new THREE.Mesh(haloGeo, haloMat);
				mesh.add(halo);
			}
			return mesh;
		});

		fg.linkColor(() => 'rgba(70,110,150,0.55)')
			.linkOpacity(0.55)
			.linkWidth(0.6)
			.linkDirectionalParticles(2)
			.linkDirectionalParticleWidth(0.6)
			.linkDirectionalParticleSpeed(0.003);

		fg.onNodeHover((node: DagNodeData | null, prev: DagNodeData | null) => {
			// Reset previous
			if (prev) {
				const objPrev = (prev as any).__threeObj as THREE.Mesh;
				if (objPrev) {
					const basePrev = objPrev.userData.baseScale ?? 1;
					objPrev.scale.setScalar(basePrev);
					const matPrev = objPrev.material as THREE.MeshStandardMaterial;
					if (matPrev && objPrev.userData.emissiveBase) {
						matPrev.emissive.copy(objPrev.userData.emissiveBase);
					}
				}
			}
			if (node) {
				const obj = (node as any).__threeObj as THREE.Mesh;
				if (obj) {
					const base = obj.userData.baseScale ?? 1;
					obj.scale.setScalar(base * 1.18);
					const mat = obj.material as THREE.MeshStandardMaterial;
					if (mat && obj.userData.emissiveBase) {
						mat.emissive.copy(obj.userData.emissiveBase).addScalar(0.45);
					}
				}
				setTooltip({
					x: lastPointerRef.current.x,
					y: lastPointerRef.current.y,
					label: node.id === 'root' ? `Root: ${sunLabel}` : node.label
				});
			} else {
				setTooltip(null);
			}
		});

		fg.onNodeDrag((node: DagNodeData) => {
			const obj = (node as any).__threeObj as THREE.Mesh;
			if (!obj) return;
			if (!obj.userData.dragging) {
				obj.userData.dragging = true;
				obj.userData.baseScale = 1.55; // expansión al iniciar drag
				obj.userData.dragEase = 0;
			}
		});
		fg.onNodeDragEnd((node: DagNodeData) => {
			const obj = (node as any).__threeObj as THREE.Mesh;
			if (!obj) return;
			obj.userData.dragging = false;
			obj.userData.dragEase = 1; // iniciar easing de regreso
		});

		// subtle breathing animation
		const clock = new THREE.Clock();
		function animate() {
			const t = clock.getElapsedTime();
			fg.scene().traverse(o => {
				if ((o as any).isMesh && o.userData) {
					// pulsación durante drag
					if (o.userData.dragging) {
						const pulse = 0.04 * Math.sin(t * 8);
						const base = o.userData.baseScale;
						o.scale.setScalar(base + pulse);
					} else {
						// easing de vuelta
						if (o.userData.dragEase > 0) {
							o.userData.dragEase -= 0.03;
							if (o.userData.dragEase <= 0) {
								o.userData.dragEase = 0;
								o.userData.baseScale = 1;
							} else {
								// interpolar baseScale hacia 1
								o.userData.baseScale += (1 - o.userData.baseScale) * 0.15;
							}
							const base = o.userData.baseScale;
							// Si está hover se ajustará en onNodeHover, aquí mantenemos base
							if (!tooltip || (tooltip && !tooltip.label.includes(o.name))) {
								o.scale.setScalar(base);
							}
						}
					}
					// ligera rotación estética
					o.rotation.y += 0.002;
				}
			});
			requestAnimationFrame(animate);
		}
		animate();

		// Resize
		const ro = new ResizeObserver(entries => {
			for (const e of entries) {
				const w = e.contentRect.width;
				const h = e.contentRect.height || 1;
				fg.width(w);
				fg.height(h);
				fg.camera().aspect = w / h;
				fg.camera().updateProjectionMatrix();
			}
		});
		ro.observe(containerRef.current);

		// pointer tracking for tooltip
		const lastPointer = lastPointerRef.current;
		function onMove(ev: PointerEvent) {
			const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
			lastPointer.x = ev.clientX - rect.left + 12;
			lastPointer.y = ev.clientY - rect.top + 12;
			if (tooltip) {
				setTooltip(t => t ? { ...t, x: lastPointer.x, y: lastPointer.y } : t);
			}
		}
		containerRef.current.addEventListener('pointermove', onMove);

		// initial data
		fg.graphData(buildGraphData(depth));

		return () => {
			containerRef.current?.removeEventListener('pointermove', onMove);
			ro.disconnect();
			// Best-effort cleanup
			graphRef.current = null;
			while (scene.children.length) scene.remove(scene.children[0]);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // init once

	// store pointer position
	const lastPointerRef = useRef<{x:number;y:number}>({x:0,y:0});
	const lastPointer = lastPointerRef; // alias

	// Update graph on depth or label change
	useEffect(() => {
		if (graphRef.current) {
			const data = buildGraphData(depth);
			graphRef.current.graphData(data);
			setTooltip(null);
		}
	}, [depth, sunLabel]);

	return (
			<div
				ref={containerRef}
				style={{
					position: 'absolute',
					inset: 0,
					zIndex: 1,
					overflow: 'hidden'
				}}
			>
				{tooltip && (
					<div
						style={{
							position:'absolute',
							transform:`translate(${tooltip.x}px, ${tooltip.y}px)`,
							pointerEvents:'none',
							background:'rgba(18,28,44,0.85)',
							border:'1px solid rgba(140,180,255,.3)',
							color:'#d6e6ff',
							fontSize:'.55rem',
							padding:'.35rem .5rem',
							borderRadius:'.45rem',
							letterSpacing:'.4px',
							whiteSpace:'nowrap'
						}}
					>
						{tooltip.label}
					</div>
				)}
			</div>
		);
};

export default Planets;
