import React, { useRef, useMemo } from 'react';
import Universe from '../three/Universe';
import type { UniverseRef } from '../three/Universe';

import '../styles/spaceBackground.css';

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiService, type CombinedGroup } from '../services/ApiService';

const STORAGE_KEY = 'combinedGroupsV1';

function pickGalaxyLabel(labels: string[], used: Set<string>, idx: number): string {
  const base = labels
    .filter(w => typeof w === 'string')
    .map(w => w.trim())
    .filter(w => /^[A-Za-z]{4,}$/.test(w));
  const unique = Array.from(new Set(base.map(w => w.toLowerCase())));
  const tokens: string[] = [];
  if (unique.length >= 3) {
    const pool = [...unique];
    for (let i = 0; i < 3; i++) {
      const r = Math.floor(Math.random() * pool.length);
      tokens.push(pool.splice(r, 1)[0]);
    }
  } else if (unique.length > 0) {
    tokens.push(...unique);
  }
  let fallbackIdx = idx;
  while (tokens.length < 3) {
    const fallbackWords = curatedFallbacks[fallbackIdx % curatedFallbacks.length]
      .split(/\s+/)
      .map(w => w.toLowerCase())
      .filter(w => /^[a-z]{3,}$/i.test(w));
    for (const fw of fallbackWords) {
      if (tokens.length < 3) tokens.push(fw); else break;
    }
    fallbackIdx++;
  }
  const formatted = tokens.slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1));
  let name = formatted.join(', ');
  if (used.has(name)) {
    let c = 2;
    while (used.has(`${name} (${c})`)) c++;
    name = `${name} (${c})`;
  }
  used.add(name);
  return name;
}

const curatedFallbacks = [
	'Lympha Core','Endothelial Flow','Caveolar Nexus','Metabolic Arc','Genomic Horizon','Spaceflight Array',
	'Splicing Helix','Immunogenic Field','Cardio Pulse','Viral Shield','Cytokine Aurora','Macrophage Ring',
	'Quantum Receptor','Adaptive Matrix','Antibody Spiral','Signal Cascade','Transcription Gate','Proteomic Drift',
	'Cellular Forge','Inflammatory Veil','Molecular Bridge','Epigenetic Bloom','Chondroitin Realm','Glycan Sector',
	'Variant Ridge','Defense Halo','Nanoparticle Crown','Host Interface','Vector Lattice','Repertoire Basin',
	'Lymphatic Stream','Gravity Shift','Chromatin Wave','Microbial Frontier','Sulfated Strand','Macromolecule Orbit',
	'Determinant Arch','Unloading Axis','Skeletal Frame','Pharmacokinetic Loop','Heparin Field','Spike Barrier',
	'Fusion Corridor','Endosomal Path','Receptor Cluster','Immunity Gate','Cardiomyocyte Vault','Codon Spiral',
	'Corticosteroid Ring','Determinant Forge','Antiviral Crest','Genome Labyrinth'
];

const GraphPage: React.FC = () => {
	const navigate = useNavigate();
	const [pendingSun, setPendingSun] = useState<{ galaxy: string; sunIndex: number; title?: string; pmcId?: string | null } | null>(null);
	const [transitioning, setTransitioning] = useState(false);
	const NAVBAR_HEIGHT = 56;
	const GRAPH_NAVBAR_HEIGHT = 50;
	const TOTAL_NAV_HEIGHT = NAVBAR_HEIGHT + GRAPH_NAVBAR_HEIGHT;
	const universeRef = useRef<UniverseRef | null>(null);
	const [groups, setGroups] = useState<CombinedGroup[]>([]);
	const [galaxyNames, setGalaxyNames] = useState<string[]>([]);
	const [galaxyArticles, setGalaxyArticles] = useState<Record<string, string[]>>({});
	const [galaxyArticleEntries, setGalaxyArticleEntries] = useState<Record<string, { title: string; id: string | null }[]>>({});
	const [loadingData, setLoadingData] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [galaxyGroupIndex, setGalaxyGroupIndex] = useState<Record<string, number>>({});

	useEffect(() => {
		let stored: CombinedGroup[] = [];
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) stored = JSON.parse(raw);
		} catch {}
		// Migración: si articles es array de strings -> convertir
		const migrated = stored.map(g => {
			if (Array.isArray(g.articles) && g.articles.length && typeof g.articles[0] === 'string') {
				const parsed = (g.articles as any[]).map((s: string) => {
					// Formatos previos:  "12: \"Title :: PMCXXXX\"" o "3: \"Title\""
					const m = s.match(/^\s*\d+:\s*"(.+?)"\s*$/);
					let full = m ? m[1] : s;
					let id: string | null = null;
					let title = full;
					const sep = full.lastIndexOf('::');
					if (sep !== -1) {
						title = full.substring(0, sep).trim();
						const maybe = full.substring(sep + 2).trim();
						if (/^PMC\w+/i.test(maybe)) id = maybe;
					}
					return { title, id };
				});
				return { ...g, articles: parsed, articleEntries: parsed };
			}
			// Si ya viene con articleEntries pero no articles
			if (!Array.isArray(g.articles) && Array.isArray((g as any).articleEntries)) {
				return { ...g, articles: (g as any).articleEntries };
			}
			return g;
		});
		if (migrated.length) stored = migrated;
		if (stored && stored.length) {
			setGroups(stored);
			setLoadingData(false);
			return;
		}
		const { promise, abort } = apiService.withAbort(signal => apiService.getCombinedGroups(signal));
		promise
			.then(res => {
				setGroups(res);
				try { localStorage.setItem(STORAGE_KEY, JSON.stringify(res)); } catch {}
			})
			.catch(err => console.error('[GraphPage] fetch combined fallback error:', err))
			.finally(() => setLoadingData(false));
		return () => abort();
	}, []);

	useEffect(() => {
		if (!groups.length) return;
		const used = new Set<string>();
		const names: string[] = [];
		const articlesMap: Record<string, string[]> = {};
		const entriesMap: Record<string, { title: string; id: string | null }[]> = {};
		const groupIndexMap: Record<string, number> = {};
		groups.slice(0, 52).forEach((g, idx) => {
			const name = pickGalaxyLabel(g.labels, used, idx);
			names.push(name);
			const articleObjs = (g.articles || g.articleEntries || []) as any[];
			entriesMap[name] = articleObjs.map(a => ({ title: a.title, id: a.id ?? null }));
			articlesMap[name] = entriesMap[name].map(a => a.title);
			groupIndexMap[name] = idx;
		});
		setGalaxyNames(names);
		setGalaxyArticles(articlesMap);
		setGalaxyArticleEntries(entriesMap);
		setGalaxyGroupIndex(groupIndexMap);
		console.log('[GraphPage] Galaxy mapping (with entries):', { names, groupIndexMap });
	}, [groups]);

	const themes = galaxyNames;
	const filteredThemes = themes.filter(t =>
		t.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleSunSelect = (data: { galaxy: string; sunIndex: number; title?: string; pmcId?: string | null }) => {
		setPendingSun(data);
	};

	const confirmGo = () => {
		if (!pendingSun) return;
		setTransitioning(true);
		let { title = '', pmcId = '' } = pendingSun;
		// Fallback (solo si no vino desde Universe)
		if ((!title || !pmcId) && galaxyGroupIndex[pendingSun.galaxy] != null) {
			const group = groups[galaxyGroupIndex[pendingSun.galaxy]];
			const entry = group?.articles?.[pendingSun.sunIndex];
			if (entry) {
				title = title || entry.title;
				pmcId = pmcId || entry.id || '';
			}
		}
		console.log('[GraphPage] Navigation resolved (routing with cached data):', {
			galaxy: pendingSun.galaxy,
			sunIndex: pendingSun.sunIndex,
			title,
			pmcId
		});
		setTimeout(() => {
			navigate(
				`/graph-sun?sun=${encodeURIComponent(pendingSun.galaxy)}&idx=${pendingSun.sunIndex}` +
				`&pmc=${encodeURIComponent(pmcId || '')}&title=${encodeURIComponent(title || '')}`
			);
		}, 450);
	};

	const cancelGo = () => setPendingSun(null);

	const handleFocusGalaxy = (name: string) => {
		universeRef.current?.focusGalaxy(name);
	};

	// Memo: evita re-render de Universe al cambiar searchTerm
	const universeElement = useMemo(() => (
		<Universe
			ref={universeRef}
			galaxies={themes}
			galaxyArticles={galaxyArticles}
			galaxyArticleEntries={galaxyArticleEntries}
			autoRotate
			onSunSelect={handleSunSelect}
		/>
	), [themes, galaxyArticles, galaxyArticleEntries]);

	return (
		<div className={`space-wrapper ${transitioning ? 'jump-out' : ''}`}>
			<div className="stars" />
			<div className="twinkling" />
			<div className="clouds" />
			<main style={{
				minHeight: '100vh',
				width: '100%',
				margin: 0,
				padding: 0,
				position: 'relative',
				zIndex: 5
			}}>
				<section style={{
					width: '100%',
					minHeight: '100vh',
					margin: 0,
					padding: 0,
					background: 'transparent',
					border: 'none',
					display: 'flex',
					flexDirection: 'column'
				}}>
					<div style={{
						position: 'relative',
						width: '100%',
						height: `calc(100vh - ${TOTAL_NAV_HEIGHT}px)`,
						marginTop: 0,
						overflow: 'hidden'
					}}>
						<div style={{
							position:'absolute',
							top:0,
							left:0,
							height:'100%',
							width:'260px',
							padding:'0.85rem .95rem .9rem',
							display:'flex',
							flexDirection:'column',
							gap:'.65rem',
							background:'linear-gradient(165deg, rgba(15,22,35,.82), rgba(10,15,25,.9))',
							backdropFilter:'blur(10px)',
							borderRight:'1px solid rgba(255,255,255,.08)',
							zIndex:25
						}}>
							<h4 style={{
								margin:'0 0 .35rem',
								fontSize:'.72rem',
								letterSpacing:'1.3px',
								fontWeight:600,
								color:'#ffcf7d',
								textTransform:'uppercase'
							}}>Index</h4>
							<div style={{position:'relative'}}>
								<input
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									placeholder="Find cluster..."
									style={{
										width:'80%',
										padding:'.5rem .65rem',
										background:'rgba(255,255,255,0.07)',
										border:'1px solid rgba(255,255,255,0.12)',
										borderRadius:'.55rem',
										color:'#e8f2ff',
										fontSize:'.62rem',
										letterSpacing:'.4px',
										outline:'none'
									}}
								/>
							</div>
							<ul style={{
								listStyle:'none',
								margin:0,
								padding:0,
								flex:1,
								overflowY:'auto',
								display:'flex',
								flexDirection:'column',
								gap:'.45rem'
							}}>
									{loadingData && !themes.length && (
										<li style={{ fontSize: '.65rem', color: '#ccc' }}>Cargando galaxias...</li>
									)}
									{!loadingData && !filteredThemes.length && (
										<li style={{ fontSize: '.6rem', color:'#8896ab' }}>Sin coincidencias</li>
									)}
									{!loadingData && filteredThemes.map(t => (
										<li key={t} style={{
											display:'flex',
											alignItems:'center',
											justifyContent:'space-between',
											gap:'.6rem',
											background:'rgba(255,255,255,0.035)',
											padding:'.5rem .6rem',
											borderRadius:'.55rem',
											border:'1px solid rgba(255,255,255,0.07)',
											lineHeight:1.25
										}}>
											<span style={{
												fontSize:'.62rem',
												letterSpacing:'.35px',
												color:'#e3f0ff',
												flex:1,
												whiteSpace:'normal'
											}}>{t}</span>
											<button
												onClick={() => handleFocusGalaxy(t)}
												style={{
													border:'none',
													background:'linear-gradient(135deg,#ffb347,#ff8a3d)',
													color:'#1a1205',
													fontSize:'.58rem',
													fontWeight:600,
													padding:'.38rem .6rem',
													borderRadius:'.45rem',
													cursor:'pointer',
													letterSpacing:'.5px',
													flexShrink:0,
													boxShadow:'0 2px 10px -4px rgba(0,0,0,.55)'
												}}
											>Go</button>
										</li>
									))}
							</ul>
						</div>
						{/* Reemplaza <Universe .../> por elemento memoizado */}
						{universeElement}
						{pendingSun && !transitioning && (
							<div style={{
								position:'absolute',
								inset:0,
								display:'flex',
								alignItems:'center',
								justifyContent:'center',
								backdropFilter:'blur(10px) saturate(160%)',
								background:'radial-gradient(circle at 50% 45%, rgba(30,45,70,.65), rgba(5,10,18,.85))',
								zIndex:30
							}}>
								<div style={{
									minWidth:'300px',
									maxWidth:'360px',
									padding:'1.2rem 1.4rem 1.3rem',
									border:'1px solid rgba(255,255,255,.12)',
									borderRadius:'1rem',
									boxShadow:'0 10px 32px -12px #000',
									background:'linear-gradient(155deg, rgba(18,28,45,.9), rgba(10,16,26,.92))',
									fontSize:'.8rem',
									letterSpacing:'.4px',
									position:'relative',
									overflow:'hidden'
								}}>
									<div style={{
										position:'absolute',
										inset:0,
										background:'radial-gradient(circle at 30% 25%, rgba(255,200,90,.12), transparent 70%)',
										pointerEvents:'none'
									}}/>
									<h3 style={{margin:'0 0 .6rem', fontSize:'.95rem', color:'#ffd777', letterSpacing:'.6px'}}>Go to the article</h3>
									<p style={{margin:'0 0 .9rem', lineHeight:1.4}}>
									You have selected the article #{pendingSun.sunIndex + 1} from the cluster <strong>{pendingSun.galaxy}</strong>. Do you want to continue?
									</p>
									<div style={{display:'flex', gap:'.6rem'}}>
										<button onClick={confirmGo} style={{
											flex:1,
											background:'linear-gradient(135deg,#ffb347,#ff8a3d)',
											border:'none',
											color:'#1a1205',
											fontWeight:600,
											padding:'.55rem 0',
											borderRadius:'.55rem',
											cursor:'pointer',
											letterSpacing:'.5px',
											boxShadow:'0 4px 18px -6px rgba(0,0,0,.6)'
										}}>
											Enter
										</button>
										<button onClick={cancelGo} style={{
											flex:1,
											background:'#1f2b40',
											border:'1px solid #33455f',
											color:'#d2e6ff',
											fontWeight:600,
											padding:'.55rem 0',
											borderRadius:'.55rem',
											cursor:'pointer',
											letterSpacing:'.5px'
										}}>
											Cancel
										</button>
									</div>
								</div>
							</div>
						 )}
						 {transitioning && (
							<div style={{
								position:'absolute',
								inset:0,
								background:'radial-gradient(circle at 50% 50%, rgba(255,170,60,.18), transparent 70%)',
								mixBlendMode:'screen',
								animation:'pulseFade 0.7s ease forwards',
								zIndex:40,
								pointerEvents:'none'
							}}/>
						 )}
					</div>
				</section>
			</main>
		</div>
	);
};

export default GraphPage;
