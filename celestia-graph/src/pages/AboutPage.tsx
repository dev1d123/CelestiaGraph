import React from 'react';

const cardStyle: React.CSSProperties = {
	background: 'linear-gradient(150deg,#101b2cdd,#0c1320e6)',
	border: '1px solid #1d2e42',
	borderRadius: '1rem',
	padding: '1.1rem 1.15rem 1.3rem',
	boxShadow: '0 10px 26px -16px #000'
};

const AboutPage: React.FC = () => (
	<div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#09131d,#0e1c2c)' }}>
		<main style={{ maxWidth: '980px', margin: '0 auto', padding: '1.6rem 1.2rem 3.4rem', display: 'flex', flexDirection: 'column', gap: '2.4rem' }}>
			<header>
				<h1 style={{ margin: '0 0 1rem', fontSize: '1.9rem', letterSpacing: '.6px', background: 'linear-gradient(90deg,#43e9ff,#ff3fb4 70%,#b4ff4d)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
					About the NASA Scholarly Knowledge Exploration Platform
				</h1>
				<p style={{ fontSize: '.9rem', lineHeight: 1.6, maxWidth: '760px', color: '#c7d8ec', margin: 0 }}>
					This platform ingests NASA‑related academic and technical literature and transforms it into an
					interactive knowledge space. It lets researchers perform classical keyword / boolean retrieval,
					explore semantic clusters through a ring‑style graph, surface similar publications, and (soon)
					co‑create synthesis artifacts using an AI assistant. The goal: accelerate pattern discovery,
					contextual navigation, and hypothesis formation in seconds instead of hours.
				</p>
			</header>

			<section style={{ display: 'grid', gap: '1.4rem', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
				<div style={cardStyle}>
					<h2 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: '.5px', color: '#e6f2ff' }}>Core Objectives</h2>
					<ul style={{ margin: '.7rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.45rem', fontSize: '.68rem', letterSpacing: '.45px', color: '#9fbed6' }}>
						<li>Unify structured & semantic search for NASA literature</li>
						<li>Reveal emergent topic clusters & cross‑links visually</li>
						<li>Surface similar works to reduce blind spots</li>
						<li>Guide research direction ideation with AI (upcoming)</li>
						<li>Generate exportable, citation‑ready briefs (upcoming)</li>
					</ul>
				</div>
				<div style={cardStyle}>
					<h2 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: '.5px', color: '#e6f2ff' }}>Active Modules</h2>
					<ul style={{ margin: '.7rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.45rem', fontSize: '.68rem', letterSpacing: '.45px', color: '#9fbed6' }}>
						<li><strong style={{ color: '#43e9ff' }}>Classical Search:</strong> Boolean + phrase + exclusion filtering</li>
						<li><strong style={{ color: '#43e9ff' }}>Graph Exploration:</strong> Topic ring clustering & similarity surfacing</li>
					</ul>
					<h3 style={{ margin: '1rem 0 .3rem', fontSize: '.7rem', letterSpacing: '.5px', color: '#ffbde4', textTransform: 'uppercase' }}>In Development</h3>
					<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.64rem', letterSpacing: '.45px', color: '#7d99b0' }}>
						<li>AI Research Assistant (topic outlining & synthesis)</li>
						<li>Report / Brief PDF Export</li>
					</ul>
				</div>
				<div style={cardStyle}>
					<h2 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: '.5px', color: '#e6f2ff' }}>Value Proposition</h2>
					<p style={{ margin: '.65rem 0 0', fontSize: '.68rem', lineHeight: 1.5, letterSpacing: '.4px', color: '#9fbed6' }}>
						Instead of linear lists, researchers traverse a structured semantic space. Visual orbit layers expose how topics relate,
						while similarity scoring and (soon) generative summarization shorten the path from discovery to insight.
					</p>
				</div>
			</section>

			<section>
				<h2 style={{ margin: '0 0 .9rem', fontSize: '1.15rem', letterSpacing: '.55px', color: '#e6f2ff' }}>Team</h2>
				<p style={{ margin: '0 0 1.2rem', fontSize: '.7rem', letterSpacing: '.4px', color: '#9fbed6', maxWidth: '640px' }}>
					Multidisciplinary contributors focused on data modeling, interaction design, and applied AI for scholarly navigation.
				</p>
				<div style={{
					display: 'grid',
					gap: '1rem',
					gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))'
				}}>
					{[
						{ name: 'David Huamani Ollachica', emoji: '🛰️' },
						{ name: 'Rodrigo Fernandez Huarca', emoji: '🚀' },
						{ name: 'Mario Alaluna Agüero', emoji: '🌌' },
						{ name: 'Rafael Nina Calizaya', emoji: '🔭' },
						{ name: 'Alvaro Quispe Condori', emoji: '🪐' }
					].map(m => (
						<div key={m.name} style={{
							background: 'linear-gradient(140deg,#0f1c29,#132536)',
							border: '1px solid #1e3244',
							borderRadius: '.9rem',
							padding: '.85rem .85rem 1rem',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '.55rem',
							boxShadow: '0 8px 22px -14px #000'
						}}>
							<div style={{
								width: '62px',
								height: '62px',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '1.6rem',
								background: 'linear-gradient(135deg,#43e9ff22,#ff3fb422)',
								border: '1px solid #2c4458'
							}} aria-label={`${m.name} avatar`}>
								<span role="img" aria-hidden="true">{m.emoji}</span>
							</div>
							<div style={{ textAlign: 'center', fontSize: '.62rem', lineHeight: 1.35, letterSpacing: '.45px', color: '#cddcec', fontWeight: 600 }}>
								{m.name}
							</div>
						</div>
					))}
				</div>
			</section>

			<footer style={{ fontSize: '.58rem', letterSpacing: '.45px', opacity: .55, textAlign: 'center', marginTop: '.6rem' }}>
				Prototype state: evolving feature set. Future modules will extend synthesis, comparative analytics and export workflows.
			</footer>
		</main>
	</div>
);

export default AboutPage;
