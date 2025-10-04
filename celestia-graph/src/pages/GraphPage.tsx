import React from 'react';
import GraphNavBar from '../components/GraphNavBar';
import Universe from '../three/Universe';
import '../styles/spaceBackground.css';

const GraphPage: React.FC = () => {
	return (
		<div className="space-wrapper">
			<div className="stars" />
			<div className="twinkling" />
			<div className="clouds" />
			<GraphNavBar />
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
						flex: 1,
						position: 'relative',
						width: '100%',
						height: '100vh',
						overflow: 'hidden'
					}}>
						 <Universe autoRotate />
					</div>
				</section>
			</main>
		</div>
	);
};

export default GraphPage;
