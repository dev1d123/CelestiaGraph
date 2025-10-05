import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const injectInfoStyles = () => {
	if (document.getElementById('info-box-styles')) return;
	const style = document.createElement('style');
	style.id = 'info-box-styles';
	style.textContent = `
	.info-box-wrap {
		position: relative;
		z-index: 2;
		max-width: 1500px;
		margin: 0 auto;
		padding: clamp(2.2rem,4vw,4.2rem) clamp(1.2rem,3vw,3.2rem) clamp(3.5rem,6vw,5rem);
		display: grid;
		grid-template-columns: minmax(320px, 520px) 1fr;
		gap: clamp(2.2rem,4vw,4rem);
	}

	/* Fondo decorativo sutil */
	.info-box-wrap::before {
		content:'';
		position:absolute;
		inset:0;
		background:
			repeating-linear-gradient(115deg, #ffffff05 0 42px, transparent 42px 84px),
			radial-gradient(circle at 18% 24%, #18405a33, transparent 70%),
			radial-gradient(circle at 82% 70%, #3c1d4a33, transparent 70%);
		opacity:.55;
		mask: linear-gradient(#000, transparent 140%);
		pointer-events:none;
	}

	/* Columna izquierda */
	.info-left {
		position: relative;
		display:flex;
		flex-direction:column;
		gap:1.6rem;
		padding: clamp(1.8rem,2.4vw,2.6rem);
		border:1px solid #ffffff14;
		border-radius: 1.6rem;
		background:
			linear-gradient(150deg,#101b2cdd,#0c1320e6),
			radial-gradient(circle at 110% -10%, #43e9ff22, transparent 70%);
		box-shadow: 0 12px 34px -18px #000, 0 0 0 1px #ffffff08;
		overflow:hidden;
		isolation:isolate;
	}

	.info-left::after {
		content:'';
		position:absolute;
		inset:-1px;
		background:
			linear-gradient(90deg, #43e9ff22, transparent 40%, transparent 60%, #ff3fb422),
			radial-gradient(circle at 30% 120%, #b4ff4d11, transparent 75%);
		mix-blend-mode: overlay;
		pointer-events:none;
	}

	.info-left h2 {
		margin:0;
		font-size:clamp(1.9rem,3.4vw,2.8rem);
		line-height:1.05;
		font-weight:800;
		background:linear-gradient(90deg,#43e9ff,#ff3fb4 60%,#b4ff4d);
		-webkit-background-clip:text;
		-webkit-text-fill-color:transparent;
		filter: drop-shadow(0 0 6px #43e9ff55);
		animation: infoHeadFade .9s .05s both;
	}

	@keyframes infoHeadFade {
		from { opacity:0; transform: translateY(22px) scale(.96); filter: blur(6px); }
		to { opacity:1; transform:none; filter: blur(0); }
	}

	.info-left p {
		margin:0;
		font-size:clamp(1.02rem,1.5vw,1.18rem);
		line-height:1.55;
		color: var(--text-dim);
		animation: infoParaFade 1s .18s both;
	}

	@keyframes infoParaFade {
		from { opacity:0; transform: translateY(18px); }
		to { opacity:1; transform:none; }
	}

	/* Grid derecha */
	.info-right {
		display:grid;
		grid-template-columns: repeat(auto-fit,minmax(280px,1fr));
		gap:clamp(1.6rem,2vw,2.2rem);
		align-content:start;
		position:relative;
	}

	.feature-card {
		position:relative;
		display:flex;
		flex-direction:column;
		gap:1rem;
		padding:1.2rem 1.2rem 1.6rem;
		border:1px solid #ffffff10;
		border-radius:1.4rem;
		background:linear-gradient(160deg,#112032dd,#0d1628f2);
		box-shadow:0 10px 32px -16px #000, 0 0 0 1px #ffffff08;
		overflow:hidden;
		transform:translateY(24px) scale(.96);
		opacity:0;
		animation: cardRise .85s cubic-bezier(.4,.2,.2,1) forwards;
		backdrop-filter: blur(14px) saturate(140%);
	}

	.feature-card:nth-child(2){ animation-delay:.12s; }

	@keyframes cardRise {
		to { opacity:1; transform:none; }
	}

	.feature-card::before {
		content:'';
		position:absolute;
		inset:0;
		background:
			radial-gradient(circle at 78% 18%, #43e9ff22, transparent 70%),
			radial-gradient(circle at 22% 82%, #ff3fb422, transparent 70%);
		mix-blend-mode:color-dodge;
		opacity:.8;
		pointer-events:none;
	}

	.feature-media {
		position:relative;
		border-radius:1rem;
		overflow:hidden;
		aspect-ratio: 16/9;
		background:#0d1a26;
		box-shadow:0 4px 18px -8px #000;
	}

	.feature-media picture,
	.feature-media img {
		width:100%;
		height:100%;
		object-fit:cover;
		display:block;
		transition: transform .9s cubic-bezier(.25,.65,.25,1), filter .6s;
	}

	.feature-card:hover .feature-media img {
		transform: scale(1.08);
		filter: brightness(1.15) saturate(1.15);
	}

	.feature-card h3 {
		margin:.2rem 0 0;
		font-size:1.25rem;
		font-weight:700;
		letter-spacing:.5px;
		background:linear-gradient(90deg,#43e9ff,#ff3fb4 70%);
		-webkit-background-clip:text;
		-webkit-text-fill-color:transparent;
	}

	.feature-card p {
		margin:0;
		font-size:.95rem;
		line-height:1.5;
		color: var(--text-dim);
	}

	.feature-actions {
		margin-top:.6rem;
	}

	.feature-btn {
		display:inline-flex;
		align-items:center;
		gap:.5rem;
		padding:.65em 1.35em;
		font-size:.9rem;
		font-weight:600;
		border-radius:2em;
		border:1px solid #43e9ff55;
		background:
			linear-gradient(90deg,#0d1a28,#122539),
			linear-gradient(90deg,#43e9ff,#ff3fb4);
		background-origin:border-box;
		background-clip: padding-box, border-box;
		color:#e8f6ff;
		cursor:pointer;
		position:relative;
		transition: transform .4s, box-shadow .4s;
	}

	.feature-btn:hover {
		transform: translateY(-4px);
		box-shadow:0 6px 28px -10px #43e9ff99;
	}

	.feature-btn:active {
		transform: translateY(-1px) scale(.97);
	}

	/* Línea lateral decorativa para tarjetas */
	.feature-card .side-accent {
		position:absolute;
		left:0;
		top:0;
		bottom:0;
		width:4px;
		background: linear-gradient(180deg,#43e9ff,#ff3fb4,#b4ff4d);
		filter: drop-shadow(0 0 6px #43e9ffaa);
		opacity:.9;
	}

	/* Responsive */
	@media (max-width: 1180px) {
		.info-box-wrap {
			grid-template-columns: 1fr;
		}
		.info-left {
			order: -1;
		}
	}

	@media (max-width: 620px) {
		.info-left { padding: 1.6rem 1.4rem 2.1rem; }
		.feature-card { padding: 1rem 1rem 1.4rem; }
	}

	/* Accesibilidad */
	.feature-btn:focus-visible {
		outline:none;
		box-shadow:0 0 0 2px #09131f,0 0 0 4px var(--neon-cyan);
	}
	`;
	document.head.appendChild(style);
};

// Añadido: componente para resolver imagen con múltiples extensiones y fallback
const FeatureImage: React.FC<{ base: string; alt: string }> = ({ base, alt }) => {
	const exts = ['webp','png','jpeg','jpg'];
	const [src,setSrc] = React.useState<string | null>(null);
	const [failed,setFailed] = React.useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			for (const ext of exts) {
				const candidate = `/img/${base}.${ext}`;
				const ok = await new Promise<boolean>(res => {
					const img = new Image();
					img.onload = () => res(true);
					img.onerror = () => res(false);
					img.src = candidate;
				});
				if (cancelled) return;
				if (ok) { setSrc(candidate); return; }
			}
			setFailed(true);
		})();
		return () => { cancelled = true; };
	}, [base]);

	if (failed) {
		return (
			<div className="feature-media feature-media-fallback">
				<div className="feature-fallback-inner">
					<span>{alt}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="feature-media">
			{src && <img src={src} alt={alt} loading="lazy" />}
		</div>
	);
};

// Añadir estilos fallback (solo si no existen ya)
const extraStylesId = 'info-box-extra-styles';
if (!document.getElementById(extraStylesId)) {
	const s = document.createElement('style');
	s.id = extraStylesId;
	s.textContent = `
	.feature-media-fallback {
		display:flex;
		align-items:center;
		justify-content:center;
		background: repeating-linear-gradient(45deg,#132333,#0d1626 18px);
		color: var(--text-dim);
		font-size:.75rem;
		text-align:center;
		position:relative;
	}
	.feature-fallback-inner {
		padding:.8rem 1rem;
		background: linear-gradient(120deg,#43e9ff22,#ff3fb422);
		border:1px solid #ffffff10;
		border-radius:.75rem;
		backdrop-filter: blur(4px);
		max-width:100%;
		line-height:1.2;
		font-weight:600;
		font-size:.7rem;
		letter-spacing:.5px;
		text-transform:uppercase;
	}
	.feature-media img { animation: imgFadeIn .6s ease forwards; opacity:0; }
	@keyframes imgFadeIn { to { opacity:1; } }
	`;
	document.head.appendChild(s);
}

const InformationBox: React.FC = () => {
	const navigate = useNavigate();

	const goClassic = () => navigate('/classic');
	const goGraph = () => navigate('/graph');
	const goChat = () => {
		// if chatbot widget listens to a custom event
		const ev = new CustomEvent('open-chatbot');
		window.dispatchEvent(ev);
		// fallback: scroll to top (widget likely fixed)
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<section
			style={{
				maxWidth: '95%',
				margin: '0 auto',
				padding: '3rem 1.4rem 4rem',
				display: 'flex',
				flexDirection: 'column',
				gap: '2.4rem',
				// DARK MODE BACKGROUND (nuevo)
				background: 'linear-gradient(160deg,#050b12 0%,#08131e 55%,#0d1f33 100%)',
				position: 'relative',
				borderTop: '1px solid #0f2a3d',
				borderBottom: '1px solid #0f2a3d',
				boxShadow: '0 40px 80px -60px #000 inset, 0 0 0 1px #0b2234',
				borderRadius: '0 0 1.4rem 1.4rem'
			}}
		>
			{/* overlay suave luminoso (nuevo) */}
			<div style={{
				position:'absolute',
				inset:0,
				pointerEvents:'none',
				background:
					'radial-gradient(circle at 18% 24%,rgba(67,233,255,.08),transparent 60%),' +
					'radial-gradient(circle at 82% 72%,rgba(255,63,180,.07),transparent 65%)'
			}} />
			<header style={{ maxWidth: '860px', position:'relative', zIndex:1 }}>
				<h2 style={{
					margin: 0,
					fontSize: '2.1rem',
					lineHeight: 1.15,
					letterSpacing: '.5px',
					background: 'linear-gradient(90deg,#43e9ff,#ff3fb4)',
					WebkitBackgroundClip: 'text',
					color: 'transparent'
				}}>
					NASA Scholarly Knowledge Exploration Platform
				</h2>
				<p style={{
					margin: '1rem 0 0',
					fontSize: '.95rem',
					lineHeight: 1.55,
					color: '#c7d8ec',
					letterSpacing: '.35px',
					maxWidth: '760px'
				}}>
					This tool ingests NASA–related academic articles and transforms them into an interactive knowledge space.  
					You can run a classical (Google Scholar style) query, explore a planetary ring graph that clusters articles
					by thematic labels, surface the most semantically similar publications, and use an AI assistant to craft
					research directions or synthesize topic overviews.
				</p>
			</header>

			<div
				style={{
					display: 'grid',
					gap: '1.4rem',
					gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))',
					position:'relative',
					zIndex:1
				}}
			>
				<FeatureCard
					title="Classical Search"
					desc="Boolean / keyword filtering similar to Google Scholar. Combine required terms, exact phrases, and excluded tokens to refine NASA literature."
					bullet={[
						'AND multi‑token matching',
						'Exact phrase constraint',
						'Exclude noisy terms',
						'Sorted by citations & year'
					]}
					cta="Try now"
					onClick={goClassic}
				/>
				<FeatureCard
					title="Graph Search"
					desc="Orbital ring visualization groups articles by topic layers and highlights cross‑similarity. Inspect clusters, hover to reveal metadata, and pivot quickly."
					bullet={[
						'Topic ring clustering',
						'Similarity surfacing',
						'Interactive 3D orbit',
						'Semantic exploration'
					]}
					cta="Explore graph"
					onClick={goGraph}
				/>
				<FeatureCard
					title="AI Research Assistant"
					desc="Chat interface to suggest investigation angles, summarize clusters, and draft structured topic maps from the NASA corpus."
					bullet={[
						'Generate topic outlines',
						'Summarize article sets',
						'Refine research queries',
						'Guide next steps'
					]}
					cta=""
					disabled
				/>
				<FeatureCard
					title="Report Export"
					desc="Assemble selected articles and AI summaries into a consolidated PDF research brief for citation-ready referencing."
					bullet={[
						'Curate article list',
						'Embed AI synthesis',
						'Compact visual layout',
						'Export to PDF'
					]}
					cta=""
					disabled
				/>
			</div>

			<footer style={{ fontSize: '.65rem', letterSpacing: '.4px', opacity: .55, textAlign: 'center', position:'relative', zIndex:1 }}>
				Dataset focus: NASA related scholarly / technical documents (demo subset). Feature set evolving.
			</footer>
		</section>
	);
};

// Reusable feature card
interface FCProps {
	title: string;
	desc: string;
	bullet: string[];
	cta: string;
	onClick?: () => void;
	disabled?: boolean;
}

const FeatureCard: React.FC<FCProps> = ({ title, desc, bullet, cta, onClick, disabled }) => (
	<div style={{
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		gap: '.75rem',
		padding: '1.25rem 1.15rem 1.35rem',
		background: 'linear-gradient(155deg,#101b2a,#0c1522)',
		border: '1px solid #1e3044',
		borderRadius: '1rem',
		boxShadow: '0 10px 28px -14px #000'
	}}>
		<h3 style={{
			margin: 0,
			fontSize: '1rem',
			letterSpacing: '.6px',
			color: '#e6f2ff'
		}}>{title}</h3>
		<p style={{
			margin: 0,
			fontSize: '.7rem',
			lineHeight: 1.45,
			color: '#b0c6dc',
			letterSpacing: '.35px',
			flexGrow: 1
		}}>{desc}</p>
		<ul style={{
			listStyle: 'none',
			margin: '.2rem 0 .1rem',
			padding: 0,
			display: 'flex',
			flexDirection: 'column',
			gap: '.35rem'
		}}>
			{bullet.map(b => (
				<li key={b} style={{ fontSize: '.62rem', color: '#8fb6ff', letterSpacing: '.4px', display: 'flex', gap: '.4rem' }}>
					<span style={{
						width: '6px',
						height: '6px',
						background: 'linear-gradient(120deg,#43e9ff,#ff3fb4)',
						borderRadius: '50%',
						marginTop: '4px',
						flexShrink: 0
					}} />
					{b}
				</li>
			))}
		</ul>
		<button
			onClick={!disabled ? onClick : undefined}
			disabled={disabled}
			style={{
				marginTop: '.4rem',
				alignSelf: 'flex-start',
				background: disabled
					? 'linear-gradient(120deg,#2c3d52,#182633)'
					: 'linear-gradient(120deg,#43e9ff,#ff3fb4 55%,#b4ff4d)',
				backgroundSize: '180% 100%',
				border: '1px solid rgba(140,180,255,.25)',
				color: disabled ? '#6e859a' : '#0d1622',
				fontSize: '.62rem',
				fontWeight: 700,
				letterSpacing: '.6px',
				padding: '.55rem .95rem',
				borderRadius: '.65rem',
				cursor: disabled ? 'not-allowed' : 'pointer',
				transition: 'background-position .6s, transform .35s',
				boxShadow: disabled
					? '0 0 0 0 #000'
					: '0 6px 22px -10px #43e9ff66'
			}}
			onMouseEnter={e => {
				if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundPosition = '100% 0';
			}}
			onMouseLeave={e => {
				if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundPosition = '0 0';
			}}
		>
			{cta}
		</button>
	</div>
);

export default InformationBox;
