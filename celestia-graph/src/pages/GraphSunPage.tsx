import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RingsGraph from '../three/RingsGraph'; // nuevo
import MiniChart3D from '../three/MiniChart3D';
import { useCart } from '../context/CartContext'; // nuevo
import '../styles/spaceBackground.css'; // añadido
import examplePMC from '../assets/example.json'; // simulación local BioC

// Constante modificable para pruebas PMC
const DEFAULT_PMC_CODE = 'PMC11988870';

// Tipo para las referencias que se enviarán al grafo
type ReferenceNode = {
	id: string;
	nombre: string;
	autores: string[];
	fecha: string | null;
};

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
	const [showRef, setShowRef] = useState(true); // referencia activa por defecto
	const [references, setReferences] = useState<ReferenceNode[]>([]);

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

	// Ajustar profundidad mínima en modo similares (>=2 para que se vean más anillos)
	useEffect(() => {
		if (similarMode && depth < 2) setDepth(2);
	}, [similarMode, depth]);

	// bloqueo de scroll (wheel / touch) al montar
	useEffect(() => {
		const prevBodyOverflow = document.body.style.overflow;
		const prevHtmlOverflow = document.documentElement.style.overflow;
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		const prevent = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};
		window.addEventListener('wheel', prevent, { passive: false });
		window.addEventListener('touchmove', prevent, { passive: false });
		return () => {
			window.removeEventListener('wheel', prevent);
			window.removeEventListener('touchmove', prevent);
			document.body.style.overflow = prevBodyOverflow;
			document.documentElement.style.overflow = prevHtmlOverflow;
		};
	}, []);

	// Simulación: carga local example.json (sin petición HTTP)
	useEffect(() => {
		try {
			console.group('[GraphSunPage] Simulated PMC BioC payload');
			console.log('Using DEFAULT_PMC_CODE:', DEFAULT_PMC_CODE);
			console.log('Full raw object (example.json):', examplePMC);

			const firstCollection: any = Array.isArray(examplePMC) ? examplePMC[0] : null;
			const firstDoc = firstCollection?.documents?.[0];
			if (firstDoc) {
				console.log('Document ID:', firstDoc.id);
				const titlePassage = firstDoc.passages?.find((p: any) => p.infons?.section_type === 'TITLE')
					|| firstDoc.passages?.[0];
				const abstractPassage = firstDoc.passages?.find((p: any) => p.infons?.section_type === 'ABSTRACT');
				console.log('Title:', titlePassage?.text);
				if (abstractPassage?.text) {
					const abs = abstractPassage.text;
					console.log('Abstract (first 300 chars):', abs.slice(0, 300) + (abs.length > 300 ? '...' : ''));
				}
				console.log('Total passages:', firstDoc.passages?.length);
				console.log('License:', firstDoc.passages?.[0]?.infons?.license);

				// -------- NUEVO: extracción de referencias --------
				const refPassages = (firstDoc.passages || []).filter(
					(p: any) => p?.infons?.section_type === 'REF' && p?.infons?.type === 'ref'
				);

				const referencias = refPassages.map((p: any, i: number) => {
					const inf = p.infons || {};
					const authorKeys = Object.keys(inf)
						.filter(k => /^name_\d+$/.test(k))
						.sort((a, b) => parseInt(a.split('_')[1], 10) - parseInt(b.split('_')[1], 10));

					const autores = authorKeys.map(k => {
						const raw = String(inf[k] || '');
						const surnameMatch = raw.match(/surname:([^;]+)/i);
						const givenMatch = raw.match(/given-names:([^;]+)/i);
						const surname = surnameMatch ? surnameMatch[1].trim() : '';
						const given = givenMatch ? givenMatch[1].trim() : '';
						return (given && surname) ? `${given} ${surname}` : (surname || raw);
					});

					return {
						id: String(i),
						nombre: p.text?.trim() || '',
						autores,
						fecha: inf.year || inf['pub-id_year'] || inf.date || null
					};
				});

				// Guardar en estado para usar en RingsGraph
				setReferences(referencias);
				// Logs existentes
				console.log('[GraphSunPage] Total referencias encontradas:', referencias.length);
				console.log('[GraphSunPage] Referencias (nombre, autores, fecha):', referencias);
				console.log('[GraphSunPage] Referencias JSON string:', JSON.stringify(referencias, null, 2));
				// ---------------------------------------------------
			} else {
				console.warn('No document found in example.json structure.');
			}
			console.groupEnd();
		} catch (e) {
			console.error('[GraphSunPage] Error simulating PMC load:', e);
		}
	}, []);

	const handleAdd = () => {
		const now = new Date();
		const artId = `${Date.now()}`; // id numérico simple
		addItem({
			id: artId,
			name: `Nodo ${sun} #${idx}`,
			date: now.toISOString().split('T')[0],
			keywords: ['dag','demo','grafico'].join(', '),
			authors: 'Autor Demo',
			abstract: 'Elemento agregado desde la visualización (demo).',
			link: `https://example.org/demo/${artId}`
		});
		setJustAdded(true);
		setTimeout(()=>setJustAdded(false), 1800);
	};

	// NUEVO: handlers claros y excluyentes
	const activateReference = () => {
		if (!showRef) {
			setShowRef(true);
			setSimilarMode(false);
			setDepth(3); // opcional: restaurar depth base al volver
		}
	};
	const activateSimilar = () => {
		if (!similarMode) {
			setSimilarMode(true);
			setShowRef(false);
			if (depth < 2) setDepth(2);
		}
	};

	return (
		<div
			className="space-wrapper" // fondo espacial
			style={{
				position:'relative',
				width:'100%',
				height:`calc(100vh - ${navOffset}px)`,
				overflow:'hidden' // asegurado
			}}
		>
			<div className="stars" />
			<div className="twinkling" />
			<div className="clouds" />
			<div style={{
				position:'relative',
				width:'100%',
				height:'100%' // ya no restamos de nuevo
			}}>
				{/* Visual principal (sin force graph) */}
				<RingsGraph
					centerLabel={sun}
					depth={depth}
					mode={showRef ? 'reference' : 'similar'}
					references={references} // NUEVO
				/>

				{/* Toast / mensajes centrados arriba (fuera de HUD laterales) */}
				<div style={{
					position:'absolute',
					top:8,
					left:'50%',
					transform:'translateX(-50%)',
					display:'flex',
					flexDirection:'column',
					alignItems:'center',
					gap:'.5rem',
					zIndex:60,
					pointerEvents:'none'
				}}>
					{justAdded && (
						<div style={toastStyle('#43e9ff','#081923')}>
							Elemento añadido a la lista
						</div>
					)}
					{showRef && (
						<div style={toastStyle('#ffb347','#211405')}>
							Modo referencia activo
						</div>
					)}
					{similarMode && (
						<div style={toastStyle('#ff3fb4','#2a0f23')}>
							Modo similares (usa el control de profundidad)
						</div>
					)}
				</div>

				{/* HUD Izquierda (gráfico 3D) */}
				<div style={{
					position:'absolute',
					top:0,
					left:0,
					height:'82%', // nuevo (antes ocupaba todo)
					width:'300px',
					padding:'14px 12px 12px',
					display:'flex',
					flexDirection:'column',
					gap:'.8rem',
					background:'linear-gradient(180deg, rgba(10,15,25,.8), rgba(10,15,25,.45))',
					borderRight:'1px solid rgba(255,255,255,.07)',
					backdropFilter:'blur(10px)',
					overflow:'hidden', // cambiado (antes auto)
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
					top:0,
					right:0,
					height:'82%', // nuevo
					width:'280px',
					padding:'16px 14px 14px',
					display:'flex',
					flexDirection:'column',
					gap:'.75rem',
					background:'linear-gradient(180deg, rgba(12,18,30,.82), rgba(12,18,30,.42))',
					borderLeft:'1px solid rgba(255,255,255,.07)',
					backdropFilter:'blur(10px)',
					overflow:'hidden', // cambiado (antes auto)
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

				 {/* Controles inferiores */}
				<div style={{
					position:'absolute',
					left:'50%',
					transform:'translateX(-50%)',
					bottom:'150px',
					padding:'10px 14px',
					display:'flex',
					alignItems:'center',
					flexWrap:'wrap',
					justifyContent:'center',
					gap:'.75rem',
					background:'rgba(12,20,34,0.72)',
					border:'1px solid rgba(140,180,255,.25)',
					borderRadius:'.95rem',
					boxShadow:'0 4px 16px -6px rgba(0,0,0,.55)',
					backdropFilter:'blur(10px) saturate(160%)',
					zIndex:65
				}}>
					<button
						onClick={activateReference}
						style={miniBtn(showRef ? '#ffb347' : '#43e9ff')}
					>
						{showRef ? 'Referencia activa' : 'Ver referencia'}
					</button>
					<button
						onClick={activateSimilar}
						style={miniBtn(similarMode ? '#ff3fb4' : '#7dff8c')}
					>
						{similarMode ? 'Similares activos' : 'Mostrar similares'}
					</button>
					<div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
						<div style={{fontSize:'.56rem', letterSpacing:'.5px', color: similarMode ? '#8fb6ff' : '#4c6279', fontWeight:600}}>
							Profundidad
						</div>
						<input
							type="range"
							min={2}
							max={6}
							value={depth}
							disabled={!similarMode}
							onChange={e => setDepth(parseInt(e.target.value, 10))}
							style={{
								width:'150px',
								opacity: similarMode ? 1 : .25,
								cursor: similarMode ? 'pointer' : 'not-allowed'
							}}
						/>
						<div style={{
							fontSize:'.58rem',
							color: similarMode ? '#ffd28a' : '#6d5f48',
							fontWeight:600,
							minWidth:'28px',
							textAlign:'right'
						}}>
							{similarMode ? depth : '-'}
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

// Nuevo helper estilo toast
const toastStyle = (accent: string, bg: string): React.CSSProperties => ({
	background:`linear-gradient(120deg, ${bg}, ${bg}dd)`,
	border:`1px solid ${accent}55`,
	color: accent === '#ffc463' ? '#201504' : '#d8f6ff',
	fontSize:'.6rem',
	padding:'.55rem .85rem',
	letterSpacing:'.55px',
	borderRadius:'.8rem',
	boxShadow:'0 6px 18px -10px #000',
	backdropFilter:'blur(6px)',
	whiteSpace:'nowrap'
});

export default GraphSunPage;
