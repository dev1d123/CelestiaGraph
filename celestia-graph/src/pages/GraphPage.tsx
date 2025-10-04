import React from 'react';
import GraphNavBar from '../components/GraphNavBar';
import Node from '../three/Node';
const GraphPage: React.FC = () => {
	return (
			<>
			<GraphNavBar />
			<main style={{
				minHeight: 'calc(100vh - 70px)',
				padding: '1.4rem clamp(1rem,2vw,2.2rem)',
				maxWidth: '1600px',
				margin: '0 auto'
			}}>
				<section style={{
					border: '1px solid #ffffff14',
					borderRadius: '1.2rem',
					minHeight: '70vh',
					background: 'linear-gradient(140deg,#0b1624,#101c30)',
					boxShadow: '0 10px 32px -18px #000',
					display: 'flex',
					flexDirection: 'column'
				}}>
					<div style={{
						padding: '1.2rem 1.4rem',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: '1px solid #ffffff10'
					}}>
						<h2 style={{
							margin: 0,
							fontSize: '1.15rem',
							letterSpacing: '.5px',
							fontWeight: 600
						}}>Visor de Grafo (placeholder)</h2>
						<span style={{ fontSize: '.75rem', opacity: .7 }}>Construyendo motor de render...</span>
					</div>
					<div style={{
						padding: '1.6rem',
						fontSize: '.9rem',
						color: 'var(--text-dim)',
						lineHeight: 1.5
					}}>
						Aquí se montará el canvas / motor de visualización del grafo modular. Integraremos
						forces, layouts incrementales, clustering y streaming de nodos conforme a actividad
						en tiempo real. Próximamente: selección, panel contextual y filtrado dinámico.
					</div>

                    
					<div style={{
						borderTop: '1px solid #ffffff10',
						position: 'relative',
						padding: 0,
						height: '480px',
						width: '100%',
						overflow: 'hidden',
						zIndex: 0
					}}>
							<Node showAxes background="#060b14" autoRotate />
					</div>
				</section>
			</main>
		</>
	);
};

export default GraphPage;
