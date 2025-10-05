import React, { useRef } from 'react';
import Universe from '../three/Universe';
import type { UniverseRef } from '../three/Universe';

import '../styles/spaceBackground.css';

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const GraphPage: React.FC = () => {
	const navigate = useNavigate();
	const [pendingSun, setPendingSun] = useState<{ galaxy: string; sunIndex: number } | null>(null);
	const [transitioning, setTransitioning] = useState(false);
	const NAVBAR_HEIGHT = 56;
	const GRAPH_NAVBAR_HEIGHT = 50;
	const TOTAL_NAV_HEIGHT = NAVBAR_HEIGHT + GRAPH_NAVBAR_HEIGHT; // renombrado
	const universeRef = useRef<UniverseRef | null>(null);
	const themes = ['Tema: A', 'Tema: B', 'Tema: C', 'Tema: D', 'Tema: E']; // nombres EXACTOS (coinciden con Universe)

	const handleSunSelect = (data: { galaxy: string; sunIndex: number }) => {
		setPendingSun(data);
	};

	const confirmGo = () => {
		if (!pendingSun) return;
		setTransitioning(true);
		setTimeout(() => {
			navigate(`/graph-sun?sun=${encodeURIComponent(pendingSun.galaxy)}&idx=${pendingSun.sunIndex}`);
		}, 650);
	};

	const cancelGo = () => setPendingSun(null);

	const handleFocusGalaxy = (name: string) => {
		universeRef.current?.focusGalaxy(name);
	};

	return (
		<div className={`space-wrapper ${transitioning ? 'jump-out' : ''}`}>
			<div className="stars" />
			<div className="twinkling" />
			<div className="clouds" />
			 {/* NavBar global ya presente */}
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
						height: `calc(100vh - ${TOTAL_NAV_HEIGHT}px)`, // actualizado
						marginTop: 0, // quitado desplazamiento duplicado
						overflow: 'hidden'
						}}>
						{/* Sidebar de galaxias */}
						<div style={{
							position:'absolute',
							top:0,
							left:0,
							height:'100%',
							width:'190px',
							padding:'0.75rem .85rem',
							display:'flex',
							flexDirection:'column',
							gap:'.65rem',
							background:'linear-gradient(165deg, rgba(15,22,35,.82), rgba(10,15,25,.9))',
							backdropFilter:'blur(10px)',
							borderRight:'1px solid rgba(255,255,255,.08)',
							zIndex:25
						}}>
							<h4 style={{
								margin:'0 0 .25rem',
								fontSize:'.7rem',
								letterSpacing:'1.2px',
								fontWeight:600,
								color:'#ffcf7d',
								textTransform:'uppercase'
							}}>Índice</h4>
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
								{themes.map(t => (
									<li key={t} style={{
										display:'flex',
										alignItems:'center',
										justifyContent:'space-between',
										gap:'.4rem',
										background:'rgba(255,255,255,0.03)',
										padding:'.45rem .55rem',
										borderRadius:'.55rem',
										border:'1px solid rgba(255,255,255,0.06)'
									}}>
										<span style={{fontSize:'.65rem', letterSpacing:'.4px', color:'#e3f0ff'}}>{t}</span>
										<button
											onClick={() => handleFocusGalaxy(t)}
											style={{
												border:'none',
												background:'linear-gradient(135deg,#ffb347,#ff8a3d)',
												color:'#1a1205',
												fontSize:'.6rem',
												fontWeight:600,
												padding:'.35rem .55rem',
												borderRadius:'.45rem',
												cursor:'pointer',
												letterSpacing:'.5px',
												boxShadow:'0 2px 10px -4px rgba(0,0,0,.55)'
											}}
										>Ir</button>
									</li>
								))}
							</ul>
						</div>
						{/* Universo (agregado ref y prop galaxies) */}
						<Universe
							ref={universeRef}
							galaxies={themes}
							autoRotate
							onSunSelect={handleSunSelect}
						/>
						{/* ...existing overlays (pendingSun modal / transitioning effect)... */}
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
									<h3 style={{margin:'0 0 .6rem', fontSize:'.95rem', color:'#ffd777', letterSpacing:'.6px'}}>Ir al Sistema</h3>
									<p style={{margin:'0 0 .9rem', lineHeight:1.4}}>
										Has seleccionado el sol #{pendingSun.sunIndex + 1} del tema <strong>{pendingSun.galaxy}</strong>. ¿Deseas explorar sus planetas?
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
											Entrar
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
											Cancelar
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
