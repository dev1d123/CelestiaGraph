import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Planets from '../three/Planets';
import MiniChart3D from '../three/MiniChart3D';
import { useCart } from '../context/CartContext'; // nuevo

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

const GraphSunPage: React.FC = () => {
	const q = useQuery();
	const navigate = useNavigate();
	const sun = q.get('sun') || 'Tema';
	const idx = q.get('idx') || '0';

	const metrics = useMemo(() => Array.from({length:7}, () => 4 + Math.random()*16), []);
	const [depth, setDepth] = useState(3); // nueva profundidad controlable
	const { addItem } = useCart(); // nuevo
	const [justAdded, setJustAdded] = useState(false); // feedback rápido

	const [navOffset, setNavOffset] = useState(106); // fallback (56+50)
	const [similarMode, setSimilarMode] = useState(false); // nuevo: activa slider
	const [showRef, setShowRef] = useState(false); // nuevo: popover referencia

	useEffect(() => {
		const calc = () => {
			const primary = document.querySelector('.nav-root') as HTMLElement | null;
			const secondary = document.querySelector('.graph-nav-root') as HTMLElement | null; // asumir clase en GraphNavBar
			const h = (primary?.offsetHeight || 0) + (secondary?.offsetHeight || 0);
			if (h > 0) setNavOffset(h);
		};
		calc();
		window.addEventListener('resize', calc);
		return () => window.removeEventListener('resize', calc);
	}, []);

	const handleAdd = () => {
		const now = new Date();
		addItem({
			id: `${sun}-${idx}-${now.getTime()}`,
			label: `Nodo ${sun} #${idx}`,
			category: ['Core', 'Edge', 'Meta'][Math.floor(Math.random()*3)],
			depth,
			energy: (50 + Math.random()*450).toFixed(0),
			price: (10 + Math.random()*190).toFixed(2),
			addedAt: now.toISOString(),
			note: 'Artículo simulado (demo)'
		});
		setJustAdded(true);
		setTimeout(()=>setJustAdded(false), 1800);
	};

	return (
			<div
				style={{
					position:'relative',
					width:'100%',
					height:`calc(100vh - ${navOffset}px)`, // ajustado
					overflow:'hidden',
					background:'#03060a'
				}}
			>
			<div style={{
				position:'relative',
				width:'100%',
				height:'100%' // ya no restamos de nuevo
			}}>
				<Planets
					sunLabel={sun}
					depth={depth}
					trimLinks
					nodePadding={4}
					/* 
						TODO en Planets:
						- Al renderizar cada link (source, target) calcular vector y recortar longitud restando nodePadding (o radio del nodo).
						- Ej: const pad = nodePadding || 0; start = lerp(source, target, pad/dist); end = lerp(target, source, pad/dist);
					*/
				/>
				{/* Etiqueta superior izquierda */}
				<div style={{
					position:'absolute',
					top:10,
					left:'14px',
					padding:'.55rem .9rem',
					borderRadius:'.75rem',
					background:'linear-gradient(140deg, rgba(25,35,55,.75), rgba(10,15,25,.85))',
					border:'1px solid rgba(255,255,255,.12)',
					color:'#ffe5b0',
					fontSize:'.7rem',
					letterSpacing:'.6px',
					textTransform:'uppercase',
					fontWeight:600,
					zIndex:20,
					backdropFilter:'blur(8px) saturate(160%)'
				}}>
					Sol #{idx} / {sun}
				</div>

				 {/* Popover referencia (nuevo) */}
				{showRef && (
					<div style={{
						position:'absolute',
						top:56,
						left:18,
						zIndex:40,
						minWidth:'240px',
						maxWidth:'300px',
						padding:'.85rem .9rem .95rem',
						background:'linear-gradient(150deg,#142233ee,#0b1422ee)',
						border:'1px solid #264564',
						borderRadius:'.9rem',
						fontSize:'.62rem',
						lineHeight:1.5,
						color:'#d1e9ff',
						boxShadow:'0 10px 32px -12px #000'
					}}>
						<h4 style={{margin:'0 0 .45rem', fontSize:'.72rem', letterSpacing:'.6px', color:'#ffcf7b'}}>Referencia Base</h4>
						<p style={{margin:0, opacity:.85}}>
							Este sistema se toma como ancla semántica para generar recomendaciones de nodos similares. Datos simulados.
						</p>
						<button
							onClick={()=>setShowRef(false)}
							style={{
								marginTop:'.7rem',
								background:'#1e3147',
								border:'1px solid #2f4d6a',
								color:'#9cd0ff',
								fontSize:'.6rem',
								padding:'.4rem .65rem',
								borderRadius:'.55rem',
								cursor:'pointer'
							}}
						>Cerrar</button>
					</div>
				)}

				{/* Badge modo similares */}
				{similarMode && (
					<div style={{
						position:'absolute',
						top:10,
						right:360,
						background:'linear-gradient(120deg,#43e9ff33,#ff3fb433)',
						border:'1px solid #43e9ff66',
						color:'#b9f3ff',
						padding:'.4rem .65rem',
						borderRadius:'.65rem',
						fontSize:'.55rem',
						letterSpacing:'.55px',
						backdropFilter:'blur(6px)'
					}}>
						Similares ACTIVOS
					</div>
				)}

				{/* HUD Izquierda (gráfico 3D) */}
				<div style={{
					position:'absolute',
					top:0,
					left:0,
					bottom:0,
					width:'360px',
					padding:'18px 14px 14px',
					display:'flex',
					flexDirection:'column',
					gap:'1rem',
					background:'linear-gradient(180deg, rgba(10,15,25,.85), rgba(10,15,25,.55))',
					borderRight:'1px solid rgba(255,255,255,.08)',
					backdropFilter:'blur(12px)',
					zIndex:15
				}}>
					<h3 style={{margin:0, fontSize:'.75rem', letterSpacing:'.55px', fontWeight:600, color:'#ffcf7b'}}>Telemetría del DAG</h3>
					<div style={{flex:'0 0 220px', position:'relative', border:'1px solid #1d2c42', borderRadius:'.8rem', overflow:'hidden', background:'radial-gradient(circle at 30% 25%, #162033, #0c141f)'}}>
						<MiniChart3D data={metrics} />
					</div>
					<div style={{fontSize:'.65rem', lineHeight:1.5, letterSpacing:'.4px', color:'#d1e2ff'}}>
						Patrón energético agregado de los nodos del grafo. Cada barra representa un canal de actividad en la red distribuida.
						<span style={{display:'block', marginTop:'.6rem', opacity:.7}}>
							Valores simulados (demo estática).
						</span>
					</div>
					<button onClick={() => navigate(-1)} style={{
						marginTop:'auto',
						background:'linear-gradient(135deg,#ffb347,#ff8a3d)',
						border:'none',
						color:'#1a1205',
						fontWeight:600,
						padding:'.55rem .9rem',
						borderRadius:'.6rem',
						letterSpacing:'.5px',
						cursor:'pointer',
						boxShadow:'0 4px 18px -6px rgba(0,0,0,.6)'
					}}>Regresar</button>
				</div>

				{/* HUD Derecha (info) */}
				<div style={{
					position:'absolute',
					top:10,
					right:0,
					bottom:0,
					width:'340px',
					padding:'18px 16px 16px',
					display:'flex',
					flexDirection:'column',
					gap:'.85rem',
					background:'linear-gradient(180deg, rgba(12,18,30,.85), rgba(12,18,30,.55))',
					borderLeft:'1px solid rgba(255,255,255,.08)',
					backdropFilter:'blur(12px)',
					zIndex:15
				}}>
					<h3 style={{margin:0, fontSize:'.75rem', letterSpacing:'.55px', fontWeight:600, color:'#ffcf7b'}}>Panel de Datos</h3>
					<ul style={{listStyle:'none',padding:0, margin:0, fontSize:'.63rem', letterSpacing:'.4px', lineHeight:1.55}}>
						<li><strong style={{color:'#ffd28a'}}>Tipo Grafo:</strong> DAG jerárquico</li>
						<li><strong style={{color:'#ffd28a'}}>Profundidad Actual:</strong> {depth}</li>
						<li><strong style={{color:'#ffd28a'}}>Generación:</strong> Procedural pseudo-aleatoria</li>
						<li><strong style={{color:'#ffd28a'}}>Motor Fuerzas:</strong> 3d-force-graph (d3-force)</li>
						<li><strong style={{color:'#ffd28a'}}>Interacción:</strong> Hover dinámico / ajuste profundidad</li>
					</ul>
					<div style={{
						marginTop:'auto',
						fontSize:'.6rem',
						opacity:.55,
						textAlign:'center',
						letterSpacing:'.45px'
					}}>
						Simulación conceptual — CelestiaGraph
					</div>
					{/* Botón agregar a lista (nuevo) */}
					<button
						onClick={handleAdd}
						style={{
							marginTop:'.9rem',
							background: 'linear-gradient(115deg,#43e9ff 0%,#ff3fb4 50%,#ffb347 100%)',
							border: '1px solid #4ad4ff',
							color:'#08131f',
							fontWeight:700,
							fontSize:'.7rem',
							letterSpacing:'.7px',
							padding:'.75rem .95rem',
							borderRadius:'.85rem',
							cursor:'pointer',
							position:'relative',
							overflow:'hidden',
							boxShadow:'0 6px 26px -8px #000, 0 0 0 1px #ffffff10'
						}}
					>
						<span style={{position:'relative', zIndex:2}}>
							{ justAdded ? 'Añadido ✔' : 'Agregar a la lista...' }
						</span>
						<div style={{
							position:'absolute',
							inset:0,
							background:'radial-gradient(circle at 30% 30%,rgba(255,255,255,.35),transparent 60%)',
							opacity:.35,
							mixBlendMode:'overlay'
						}} />
					</button>
				</div>

				{/* HUD Inferior actualizado */}
				<div style={{
					position:'absolute',
					left:'50%',
					transform:'translateX(-50%)',
					bottom:'12px',
					padding:'10px 16px',
					display:'flex',
					alignItems:'center',
					gap:'.9rem',
					background:'rgba(12,20,34,0.78)',
					border:'1px solid rgba(140,180,255,.25)',
					borderRadius:'1rem',
					boxShadow:'0 4px 18px -6px rgba(0,0,0,.55)',
					backdropFilter:'blur(10px) saturate(160%)',
					zIndex:25
				}}>
					<button
						onClick={()=>setShowRef(r=>!r)}
						style={miniBtn(showRef ? '#ffb347' : '#43e9ff')}
					>
						{showRef ? 'Ocultar ref.' : 'Ver por referencia'}
					</button>
					<button
						onClick={()=>setSimilarMode(m=>!m)}
						style={miniBtn(similarMode ? '#ff3fb4' : '#7dff8c')}
					>
						{similarMode ? 'Desactivar similares' : 'Mostrar artículos similares'}
					</button>
					<div style={{display:'flex', alignItems:'center', gap:'.55rem'}}>
						<div style={{fontSize:'.58rem', letterSpacing:'.5px', color: similarMode ? '#8fb6ff' : '#587497', fontWeight:600}}>
							Profundidad
						</div>
						<input
							type="range"
							min={1}
							max={6}
							value={depth}
							disabled={!similarMode}
							onChange={e => setDepth(parseInt(e.target.value, 10))}
							style={{
								width:'160px',
								opacity: similarMode ? 1 : .35,
								cursor: similarMode ? 'pointer' : 'not-allowed'
							}}
						/>
						<div style={{
							fontSize:'.6rem',
							color: similarMode ? '#ffd28a' : '#6d5f48',
							fontWeight:600,
							minWidth:'28px',
							textAlign:'right'
						}}>
							{depth}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Helpers nuevos (colocar antes del export si se desea)
const miniBtn = (accent: string): React.CSSProperties => ({
	background:`linear-gradient(130deg, ${accent}, ${accent}44)`,
	border:'1px solid rgba(255,255,255,.18)',
	color:'#0d1622',
	fontSize:'.55rem',
	fontWeight:600,
	letterSpacing:'.55px',
	padding:'.55rem .7rem',
	borderRadius:'.7rem',
	cursor:'pointer',
	display:'inline-flex',
	alignItems:'center',
	whiteSpace:'nowrap',
	boxShadow:'0 4px 14px -6px #000'
});

export default GraphSunPage;
