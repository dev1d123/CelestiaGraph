import React, { useEffect } from 'react';

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
		max-width:80%;
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

export const InformationBox: React.FC = () => {
	useEffect(() => {
		injectInfoStyles();
	}, []);

	return (
		<section className="info-box-wrap" id="about">
			<div className="info-left">
				<h2>¿Qué es Celestia Search?</h2>
				<p>
					Celestia Search es un motor híbrido de exploración modular que combina indexación
					semántica, consultas estructuradas y visualización relacional. Integra un pipeline
					de ingestión que normaliza bloques, transacciones y entidades; genera proyecciones
					de grafo y expone capas de búsqueda: clásica (filtrado / texto) y gráfica (navegación
					contextual y expansión de nodos). El objetivo: transformar datos crudos en
					inteligencia navegable, detectar patrones emergentes y ofrecer una experiencia
					interactiva donde cada relación cuenta.
				</p>
				<p>
					Su arquitectura desacoplada permite evolucionar módulos de parsing, cache caliente,
					stream en tiempo real y render adaptativo para mantener fluidez incluso con grandes
					volúmenes. Estamos construyendo la interfaz que convierte la complejidad modular en
					claridad visual y acción inmediata.
				</p>
			</div>
			<div className="info-right">
				<article className="feature-card" id="graph-search">
					<span className="side-accent" />
					<FeatureImage base="graphSearch" alt="Vista Graph Search" />
					<h3>Graph Search</h3>
					<p>
						Navega relaciones vivas entre entidades. Expande nodos progresivamente,
						aplica filtros dinámicos y observa la propagación temporal. Ideal para
						descubrir hubs, outliers y clústeres estructurales.
					</p>
					<div className="feature-actions">
						<button className="feature-btn" onClick={() => (location.hash = '#graph-search')}>
							Probar ahora
						</button>
					</div>
				</article>

				<article className="feature-card" id="classic-search">
					<span className="side-accent" />
					<FeatureImage base="classicSearch" alt="Vista Classic Search" />
					<h3>Classic Search</h3>
					<p>
						Búsqueda directa y precisa: filtra por hashes, alturas, tipos y atributos clave.
						Ideal para auditoría rápida, verificación puntual y flujo lineal de investigación.
					</p>
					<div className="feature-actions">
						<button className="feature-btn" onClick={() => (location.hash = '#classic-search')}>
							Probar ahora
						</button>
					</div>
				</article>
			</div>
		</section>
	);
};

export default InformationBox;
