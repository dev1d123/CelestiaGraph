import React from 'react';
// import NavBar from '../components/NavBar'; // eliminado

const AboutPage: React.FC = () => (
	<div style={{minHeight:'100vh', background:'linear-gradient(160deg,#09131d,#0e1c2c)'}}>
		{/* <NavBar /> eliminado (global) */}
		<main style={{maxWidth:'900px', margin:'0 auto', padding:'1.4rem 1.1rem 3rem'}}>
			<h1 style={{margin:'0 0 1rem', fontSize:'1.6rem', letterSpacing:'.6px'}}>About Us</h1>
			<p style={{fontSize:'.8rem', lineHeight:1.55, maxWidth:'680px'}}>
				Placeholder de información. Agrega aquí la descripción del proyecto, objetivos y equipo.
			</p>
		</main>
	</div>
);

export default AboutPage;
