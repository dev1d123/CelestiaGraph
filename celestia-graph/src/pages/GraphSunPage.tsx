import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RingsGraph from '../three/RingsGraph';
import MiniChart3D from '../three/MiniChart3D';
import { useCart } from '../context/CartContext';
import '../styles/spaceBackground.css';
import { fetchKeywordsById, fetchMetadataById, fetchClusterNumber, fetchBigramKeywords, fetchReferencesById, fetchClusterArticles } from '../services/ApiService';

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
	const pmcId = q.get('pmc') || '';
	const articleTitle = q.get('title') || ''; // NUEVO: título recibido

	const metrics = useMemo(() => Array.from({length:7}, () => 4 + Math.random()*16), []);
	const [depth, setDepth] = useState(3); // nueva profundidad controlable
	const { addItem } = useCart(); // nuevo
	const [justAdded, setJustAdded] = useState(false); // feedback rápido

	const [navOffset, setNavOffset] = useState(106); // fallback (56+50)
	const [similarMode, setSimilarMode] = useState(false); // nuevo: activa slider
	const [showRef, setShowRef] = useState(true); // referencia activa por defecto
	const [keywords, setKeywords] = useState<string[]>([]);
	const [metadata, setMetadata] = useState<import('../services/ApiService').ArticleMetadata | null>(null);
	const [clusterNumber, setClusterNumber] = useState<number | null>(null);
	const [bigramMap, setBigramMap] = useState<Record<string, string[]>>({});
	const [loadingMeta, setLoadingMeta] = useState(false);
	const [referenceTitles, setReferenceTitles] = useState<string[]>([]);
	const [similarArticlesMap, setSimilarArticlesMap] = useState<Record<string, { title: string; id: string | null }[]>>({});

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

	// Log PMC con formato requerido
	useEffect(() => {
		if (pmcId) {
			console.log('->>>>>>>>>>>>>>>' + pmcId);
		} else {
			console.log('->>>>>>>>>>>>>>>(sin_pmc)');
		}
	}, [pmcId]);

	useEffect(() => {
		let aborted = false;
		if (!pmcId) {
			setKeywords([]);
			setMetadata(null);
			setClusterNumber(null);
			return;
		}
		setLoadingMeta(true);
		const controller = new AbortController();
		Promise.all([
			fetchKeywordsById(pmcId, controller.signal),
			fetchMetadataById(pmcId, controller.signal),
			fetchClusterNumber(pmcId, controller.signal)
		]).then(([kw, meta, cNum]) => {
			if (aborted) return;
			setKeywords(kw);
			setMetadata(meta);
			setClusterNumber(cNum);
		}).catch(e => {
			if (!aborted) console.warn('[GraphSunPage] meta fetch error', e);
		}).finally(() => !aborted && setLoadingMeta(false));

		// cargar bigrams solo una vez (o si está vacío)
		if (!Object.keys(bigramMap).length) {
			fetchBigramKeywords(controller.signal)
				.then(m => { if (!aborted) setBigramMap(m); })
				.catch(e => console.warn('[GraphSunPage] bigrams error', e));
		}

		return () => { aborted = true; controller.abort(); };
	}, [pmcId]);

	// Load references & similarity sources
	useEffect(() => {
		let aborted = false;
		if (!pmcId) { setReferenceTitles([]); return; }
		const controller = new AbortController();
		fetchReferencesById(pmcId, controller.signal)
			.then(refs => { if (!aborted) setReferenceTitles(refs); })
			.catch(e => console.warn('[GraphSunPage] references error', e));

		// load cluster articles once
		if (!Object.keys(similarArticlesMap).length) {
			fetchClusterArticles(controller.signal)
				.then(map => { if (!aborted) setSimilarArticlesMap(map); })
				.catch(e => console.warn('[GraphSunPage] cluster articles error', e));
		}
		return () => { aborted = true; controller.abort(); };
	}, [pmcId]);

	// Build node lists for RingsGraph depending on mode
	const displayNodes = useMemo(() => {
		if (showRef) return referenceTitles;
		if (clusterNumber == null) return [];
		const clusterArr = similarArticlesMap[String(clusterNumber)] || [];
		return clusterArr
			.map(a => a.title)
			.filter(t => t && t !== articleTitle);
	}, [showRef, referenceTitles, clusterNumber, similarArticlesMap, articleTitle]);

	// Map displayNodes (array of titles) into ReferenceNode[] expected by RingsGraph
	const referenceNodes: ReferenceNode[] = useMemo(
		() =>
			displayNodes.map((title, i) => ({
				id: `ref-${showRef ? 'ref' : 'sim'}-${i}`,
				nombre: title,
				autores: [],          // unknown authors from external source -> empty array
				fecha: null           // no date available
			})),
		[displayNodes, showRef]
	);

	const formattedDate = React.useMemo(() => {
		if (!metadata?.date) return '';
		const d = metadata.date.trim();
		if (/^\d{8}$/.test(d)) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
		return d;
	}, [metadata]);

	const authorsList = React.useMemo(() => {
		if (!metadata?.authors || !metadata.authors.length) return [];
		return metadata.authors.map(a => {
			const gn = a.given_names || '';
			const sn = a.surname || '';
			return `${gn} ${sn}`.trim();
		});
	}, [metadata]);

	const abstractText = (metadata?.abstract || []).join('\n\n');
	const bigramsForCluster = clusterNumber != null ? bigramMap[String(clusterNumber)] : undefined;

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
					centerLabel={articleTitle || sun} // usar título si existe
					depth={depth}
					mode={showRef ? 'reference' : 'similar'}
					references={referenceNodes}  // FIX: now passing structured objects
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
							References mode
						</div>
					)}
					{!showRef && (
						<div style={toastStyle('#ff3fb4','#2a0f23')}>
							Similar mode
						</div>
					)}
				</div>

				{/* HUD Izquierda (gráfico 3D / bigrams) */}
				<div style={{
					position:'absolute',
					top:0,
					left:0,
					height:'82%',
					width:'300px',
					padding:'14px 12px 12px',
					display:'flex',
					flexDirection:'column',
					gap:'.8rem',
					background:'linear-gradient(180deg, rgba(10,15,25,.8), rgba(10,15,25,.45))',
					borderRight:'1px solid rgba(255,255,255,.07)',
					backdropFilter:'blur(10px)',
						overflowY:'auto', // <-- scroll vertical
						overflowX:'hidden',
						scrollbarWidth:'thin',
					zIndex:15
				}}>
					<h3 style={{margin:0, fontSize:'.75rem', letterSpacing:'.55px', fontWeight:600, color:'#ffcf7b'}}>Cluster Bigrams</h3>
					<div style={{
						flex:'0 0 210px',
						background:'radial-gradient(circle at 30% 25%, #162033, #0c141f)',
						border:'1px solid #1d2c42',
						borderRadius:'.8rem',
						padding:'.65rem .75rem',
						display:'flex',
						flexDirection:'column',
						gap:'.4rem',
						overflow:'hidden'
					}}>
						<div style={{fontSize:'.55rem',letterSpacing:'.45px',color:'#9fc5ff',opacity:.85}}>
							Cluster #{clusterNumber != null ? clusterNumber : '—'}
						</div>
						<div style={{
							flex:1,
							overflowY:'auto',
							fontSize:'.6rem',
							lineHeight:1.35,
							paddingRight:'.35rem'
						}}>
							{bigramsForCluster?.length
								? bigramsForCluster.map((p,i)=>
									<div key={i} style={{
										padding:'.28rem .45rem',
										marginBottom:'.3rem',
										background:'rgba(255,255,255,0.04)',
										border:'1px solid rgba(255,255,255,0.06)',
										borderRadius:'.55rem',
										letterSpacing:'.35px',
										color:'#e6f2ff'
									}}>
										{p}
									</div>
								)
								: <div style={{opacity:.55}}>Sin bigrams disponibles.</div>
							}
						</div>
					</div>
					<div style={{fontSize:'.6rem',lineHeight:1.4,color:'#d1e2ff',letterSpacing:'.4px'}}>
						Key representative bigram phrases for this cluster.
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
					}}>Back</button>
				</div>

				{/* HUD Derecha (info) */}
				<div style={{
					position:'absolute',
					top:0,
					right:0,
					height:'82%', // nuevo
					width:'320px',
					padding:'16px 16px 14px',
					display:'flex',
					flexDirection:'column',
					gap:'.75rem',
					background:'linear-gradient(180deg, rgba(12,18,30,.85), rgba(12,18,30,.42))',
					borderLeft:'1px solid rgba(255,255,255,.07)',
					backdropFilter:'blur(10px)',
						overflowY:'auto',  // <-- scroll vertical
						overflowX:'hidden',
						scrollbarWidth:'thin',
					zIndex:15
				}}>
					<h3 style={{margin:0, fontSize:'.75rem', letterSpacing:'.55px', fontWeight:600, color:'#ffcf7b'}}>Article</h3>
					<div style={{
						flex:1,
						display:'flex',
						flexDirection:'column',
						gap:'.55rem',
						overflow:'hidden'
					}}>
						<div style={{fontSize:'.63rem',letterSpacing:'.4px',lineHeight:1.4,color:'#ffdca3'}}>
							<strong style={{color:'#ffd28a'}}>Name:</strong><br/>{articleTitle || '(untitled)'}
						</div>
						<div style={{fontSize:'.6rem',letterSpacing:'.4px',color:'#e6f1ff'}}>
							<strong style={{color:'#ffd28a'}}>Date:</strong> {formattedDate || '—'}
						</div>
						<div style={{
							flex:'1 1 auto',
							minHeight:0,
							display:'flex',
							flexDirection:'column',
							gap:'.45rem',
							overflow:'hidden'
						}}>
							<div style={{fontSize:'.6rem',color:'#ffd28a'}}>Abstract:</div>
							<div style={{
								flex:1,
								overflowY:'auto',
								background:'rgba(255,255,255,0.04)',
								border:'1px solid rgba(255,255,255,0.07)',
								borderRadius:'.6rem',
								padding:'.55rem .65rem',
								fontSize:'.58rem',
								lineHeight:1.4,
								whiteSpace:'pre-wrap',
								letterSpacing:'.35px',
								color:'#dbe9ff'
							}}>
								{loadingMeta
									? 'Cargando...'
									: (abstractText || 'Sin abstract disponible.')
								}
							</div>
						</div>
						<div style={{fontSize:'.6rem',letterSpacing:'.4px'}}>
							<div style={{color:'#ffd28a', marginBottom:'.25rem'}}>Authors:</div>
							<div style={{
								maxHeight:'140px',          // aumentado
								overflowY:'auto',
								background:'rgba(255,255,255,0.04)',
								border:'1px solid rgba(255,255,255,0.07)',
								borderRadius:'.55rem',
								padding:'.55rem .6rem .45rem',
								fontSize:'.55rem',
								lineHeight:1.3,
								color:'#e9f4ff',
								scrollbarWidth:'thin'
							}}>
								{loadingMeta
									? 'Cargando...'
									: (authorsList.length
										? (
											<ol style={{
												margin:0,
												padding:'0 0 0 1.05rem',
												display:'flex',
												flexDirection:'column',
												gap:'.25rem',
												listStyle:'decimal'
											}}>
												{authorsList.map((a,i)=>(
													<li key={i} style={{
														padding:'.25rem .4rem',
														background:'rgba(255,255,255,0.05)',
														border:'1px solid rgba(255,255,255,0.08)',
														borderRadius:'.45rem',
														backdropFilter:'blur(2px)',
														display:'block',
														letterSpacing:'.35px',
														color:'#f2f7ff'
													}}>
														<span style={{opacity:.85}}>{a}</span>
													</li>
												))}
											</ol>
										)
										: 'Sin autores.'
									  )
								}
							</div>
						</div>
						<div style={{fontSize:'.6rem',letterSpacing:'.4px'}}>
							<div style={{color:'#ffd28a', marginBottom:'.25rem'}}>Keywords:</div>
							<div style={{
								display:'flex',
								flexWrap:'wrap',
								gap:'.4rem',
								maxHeight:'68px',
								overflowY:'auto',
								padding:'.2rem .1rem'
							}}>
								{keywords.length
									? keywords.map(k => (
										<span key={k} style={{
											fontSize:'.5rem',
											padding:'.28rem .45rem',
											background:'rgba(255,255,255,0.06)',
											border:'1px solid rgba(255,255,255,0.12)',
											borderRadius:'.55rem',
											letterSpacing:'.4px',
											color:'#f1f8ff'
										}}>
											{k}
										</span>
									))
									: (loadingMeta ? 'Cargando...' : <span style={{opacity:.55}}>Sin keywords.</span>)
								}
							</div>
						</div>
						<div style={{fontSize:'.6rem',letterSpacing:'.4px',color:'#e6f1ff'}}>
							<strong style={{color:'#ffd28a'}}>Cluster number:</strong> {clusterNumber != null ? clusterNumber : (loadingMeta ? '...' : '—')}
						</div>
						<div style={{
							marginTop:'auto',
							fontSize:'.55rem',
							opacity:.45,
							textAlign:'center',
							letterSpacing:'.4px'
						}}>
							PMC: {pmcId || 'N/A'}
						</div>
					</div>
					<button
						onClick={handleAdd}
						style={{
							background:'linear-gradient(115deg,#43e9ff 0%,#ff3fb4 50%,#ffb347 100%)',
							border:'1px solid #4ad4ff',
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
						{showRef ? 'References' : 'Show references'}
					</button>
					<button
						onClick={activateSimilar}
						style={miniBtn(!showRef ? '#ff3fb4' : '#7dff8c')}
					>
						{!showRef ? 'Similar' : 'Show similar'}
					</button>
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
