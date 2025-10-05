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
