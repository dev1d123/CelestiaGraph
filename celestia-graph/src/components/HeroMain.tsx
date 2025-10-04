import React, { useEffect, useRef } from 'react';

// Nota: Sin librerías externas. Opcional futuro: GSAP (timeline + scroll), Framer Motion (gestos), drei (shaders 3D).

const injectHeroStyles = () => {
	if (document.getElementById('hero-main-styles')) return;
	const style = document.createElement('style');
	style.id = 'hero-main-styles';
	style.textContent = `
	.hero-scope {
		position: relative;
		width: 100%;
		overflow: hidden;
		padding-top: 1rem;
	}
	.hero-scope::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 18% 28%, #1c2c4a 0%, transparent 60%),
			radial-gradient(circle at 82% 72%, #341c4d 0%, transparent 65%),
			linear-gradient(140deg,#09111c,#0d1421,#101b32);
		filter: brightness(1.1) saturate(1.15);
		animation: heroBgShift 22s linear infinite;
		opacity: .85;
	}
	@keyframes heroBgShift {
		0% { filter: hue-rotate(0deg) brightness(1.05); }
		50% { filter: hue-rotate(90deg) brightness(1.18); }
		100% { filter: hue-rotate(0deg) brightness(1.05); }
	}
	.hero-space-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		mix-blend-mode: lighten;
		opacity: .9;
		pointer-events: none;
	}

	.hero-main-container {
		position: relative;
		z-index: 2;
		display: flex;
		min-height: clamp(640px, 78vh, 880px);
		width: 100%;
		max-width: 1500px;
		margin: 0 auto;
		padding: 3.2rem clamp(1.2rem, 3vw, 3.4rem);
		gap: clamp(2rem, 4vw, 4rem);
	}

	/* Imagen */
	.hero-main-img {
		flex: 1.05;
		display: flex;
		align-items: center;
		justify-content: center;
		perspective: 1600px;
		position: relative;
	}
	.hero-main-img-inner {
		width: 100%;
		max-width: 520px;
		aspect-ratio: 4/5;
		border-radius: 2.4rem;
		overflow: hidden;
		position: relative;
		background: linear-gradient(120deg, #43e9ff22 0%, #ff3fb422 100%);
		box-shadow:
			0 10px 38px -12px #43e9ff66,
			0 0 0 3px #ffffff0d,
			0 0 0 10px #43e9ff1f,
			0 0 64px -6px #ff3fb440;
		animation: heroImgGlow 5.2s ease-in-out infinite alternate;
		transform-style: preserve-3d;
	}
	.hero-main-img-inner::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 68% 22%, #ff3fb422, transparent 70%),
			radial-gradient(circle at 18% 78%, #43e9ff1f, transparent 70%);
		mix-blend-mode: color-dodge;
		animation: imgAura 8s linear infinite;
	}
	@keyframes imgAura {
		0% { filter: hue-rotate(0deg); }
		50% { filter: hue-rotate(80deg) brightness(1.15); }
		100% { filter: hue-rotate(0deg); }
	}
	@keyframes heroImgGlow {
		0% { box-shadow: 0 10px 38px -12px #43e9ff66,0 0 0 3px #ffffff0d,0 0 0 10px #43e9ff1f,0 0 64px -6px #ff3fb440; }
		100% { box-shadow: 0 18px 60px -10px #ff3fb488,0 0 0 6px #ffffff14,0 0 0 20px #ff3fb422,0 0 96px -4px #43e9ff55; }
	}
	.hero-main-img-inner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: inherit;
		filter: brightness(1.05) saturate(1.12);
		transform: translateZ(0);
		transition: filter .6s, transform .8s cubic-bezier(.25,.6,.2,1);
	}
	.hero-main-img-inner:hover img {
		filter: brightness(1.2) saturate(1.3);
		transform: scale(1.06);
	}

	/* Info */
	.hero-main-info {
		flex: 1.35;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: clamp(1.6rem, 2.4vw, 2.8rem);
		position: relative;
	}
	.hero-main-info::before {
		content: '';
		position: absolute;
		inset: -10%;
		background:
			conic-gradient(from 0deg at 50% 50%, #43e9ff08, #ff3fb408, #b4ff4d08, #43e9ff08);
		filter: blur(40px);
		animation: infoBloom 14s linear infinite;
		z-index: 0;
	}
	@keyframes infoBloom {
		to { transform: rotate(360deg); }
	}
	.hero-main-title {
		position: relative;
		z-index: 2;
		font-family: 'Saira', 'Avenir', sans-serif;
		font-size: clamp(2.4rem, 5vw, 4.2rem);
		font-weight: 800;
		line-height: 1.04;
		letter-spacing: -1.5px;
		background: linear-gradient(90deg, #43e9ff 0%, #ff3fb4 55%, #b4ff4d 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: heroTitleGlow 3.4s ease-in-out infinite alternate;
		opacity: 0;
		transform: translateY(28px);
		animation: fadeSlide 1.1s .1s cubic-bezier(.4,.2,.2,1) forwards, heroTitleGlow 3.4s ease-in-out infinite alternate;
	}
	@keyframes heroTitleGlow {
		0% { text-shadow: 0 0 18px #43e9ff88,0 0 2px #ffffff; }
		100% { text-shadow: 0 0 42px #ff3fb480,0 0 10px #b4ff4d80; }
	}
	@keyframes fadeSlide {
		to { opacity: 1; transform: none; }
	}
	.hero-main-desc {
		position: relative;
		z-index: 2;
		font-size: clamp(1.05rem, 1.8vw, 1.35rem);
		color: var(--text-dim);
		max-width: 48rem;
		line-height: 1.6;
		animation: fadeUpSoft 1.1s .25s cubic-bezier(.4,.2,.2,1) both;
	}
	@keyframes fadeUpSoft {
		from { opacity: 0; transform: translateY(34px) scale(.98); filter: blur(6px); }
		to { opacity: 1; transform: none; filter: blur(0); }
	}

	/* Badges */
	.hero-main-badges {
		position: relative;
		z-index: 2;
		display: flex;
		gap: .9rem;
		flex-wrap: wrap;
	}
	.hero-badge {
		padding: .55em 1.25em;
		border-radius: 2em;
		background: linear-gradient(110deg,#43e9ff22,#ff3fb430 60%,#b4ff4d26);
		color: #fff;
		font-size: .9em;
		font-weight: 600;
		letter-spacing: .5px;
		box-shadow: 0 2px 12px -4px #43e9ff40;
		backdrop-filter: blur(4px) saturate(140%);
		border: 1px solid #ffffff12;
		position: relative;
		overflow: hidden;
		animation: badgeEntry .8s cubic-bezier(.4,.2,.2,1) both;
	}
	.hero-badge:nth-child(2){ animation-delay:.05s;}
	.hero-badge:nth-child(3){ animation-delay:.1s;}
	.hero-badge:nth-child(4){ animation-delay:.15s;}
	@keyframes badgeEntry {
		from { opacity:0; transform: translateY(18px) scale(.9); filter: blur(4px);}
		to { opacity:1; transform:none; filter: blur(0);}
	}
	.hero-badge::after {
		content:'';
		position:absolute;
		inset:0;
		background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
		transform: translateX(-120%);
		animation: badgeShine 4s 1.4s ease-in-out infinite;
	}
	@keyframes badgeShine {
		0%,65% { transform: translateX(-120%); }
		80% { transform: translateX(140%); }
		100% { transform: translateX(140%); }
	}

	/* CTA */
	.hero-main-cta {
		position: relative;
		z-index: 2;
		margin-top: .4rem;
		display: flex;
		gap: 1.2rem;
		flex-wrap: wrap;
	}
	.hero-main-cta-btn {
		padding: .95em 2.4em;
		font-size: 1.05em;
		font-weight: 700;
		border-radius: 2.2em;
		border: none;
		cursor: pointer;
		background: linear-gradient(90deg,#43e9ff 0%, #ff3fb4 50%, #b4ff4d 100%);
		background-size: 220% 100%;
		color: #fff;
		box-shadow: 0 4px 26px -10px #43e9ff80;
		transition: background-position .6s cubic-bezier(.4,.2,.2,1), transform .32s, box-shadow .32s;
		position: relative;
		overflow: hidden;
		animation: fadeUpSoft .9s .35s both;
	}
	.hero-main-cta-btn::before {
		content:'';
		position:absolute;
		inset:0;
		background:
			radial-gradient(circle at 28% 30%, rgba(255,255,255,.4), transparent 60%),
			radial-gradient(circle at 75% 70%, rgba(255,255,255,.25), transparent 70%);
		mix-blend-mode: overlay;
		opacity:.6;
	}
	.hero-main-cta-btn:hover {
		background-position: 100% 0;
		transform: translateY(-4px);
		box-shadow: 0 8px 40px -10px #ff3fb4aa, 0 0 0 2px #ffffff10;
	}
	.hero-main-cta-btn.secondary {
		background: linear-gradient(120deg,#b4ff4d 0%, #43e9ff 60%);
		color: #102018;
		box-shadow: 0 4px 26px -10px #b4ff4d80;
	}
	.hero-main-cta-btn.secondary:hover {
		background: linear-gradient(120deg,#43e9ff 0%, #b4ff4d 60%);
		color: #051410;
	}

	/* Elementos decorativos */
	.hero-decor-orb {
		position: absolute;
		width: clamp(120px,18vw,260px);
		aspect-ratio: 1;
		border-radius: 50%;
		background:
			radial-gradient(circle at 30% 30%, #ffffff, #ffffff10 30%, transparent 70%),
			radial-gradient(circle at 70% 70%, #ff3fb4, transparent 60%);
		filter: blur(6px) brightness(1.1);
		mix-blend-mode: screen;
		opacity: .16;
		animation: orbFloat 18s linear infinite;
		z-index: 1;
	}
	.hero-decor-orb.orb-1 { top: -6%; left: -4%; animation-delay: -2s; }
	.hero-decor-orb.orb-2 { bottom: -10%; right: -6%; animation-duration: 22s; }
	@keyframes orbFloat {
		0% { transform: translate3d(0,0,0) scale(1); }
		50% { transform: translate3d(40px, -30px,0) scale(1.25); }
		100% { transform: translate3d(0,0,0) scale(1); }
	}

	.floating-fragments {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}
	.fragment {
		position: absolute;
		width: 12px;
		height: 12px;
		background: linear-gradient(130deg,#43e9ff,#ff3fb4);
		border-radius: 3px;
		box-shadow: 0 0 12px 2px #43e9ffaa;
		animation: fragmentDrift linear infinite, fragmentPulse 2.4s ease-in-out infinite;
		opacity: .8;
	}
	@keyframes fragmentDrift {
		from { transform: translate3d(var(--xStart), var(--yStart),0) rotate(0deg); }
		to { transform: translate3d(var(--xEnd), var(--yEnd),0) rotate(360deg); }
	}
	@keyframes fragmentPulse {
		0%,100% { filter: brightness(1); }
		50% { filter: brightness(1.6); }
	}

	/* Responsive */
	@media (max-width: 1080px) {
		.hero-main-container { flex-direction: column; padding-top: 2.4rem; }
		.hero-main-img-inner { aspect-ratio: 16/9; max-width: 100%; border-radius: 1.6rem; }
		.hero-main-info { align-items: center; text-align: center; }
		.hero-main-title { letter-spacing: -.5px; }
		.hero-main-badges { justify-content: center; }
	}
	@media (max-width: 560px) {
		.hero-main-cta-btn { width: 100%; text-align: center; }
		.hero-main-container { padding: 2.2rem 1rem 3.4rem; }
		.fragment { display: none; }
	}
	`;
	document.head.appendChild(style);
};

type Star = {
	x: number;
	y: number;
	z: number;
	r: number;
	speed: number;
};

export const HeroMain: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const scopeRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		injectHeroStyles();
	}, []);

	// Campo estelar dinámico
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;

		const computeSize = () => {
			const parentW = canvas.parentElement?.clientWidth || window.innerWidth;
			const scopeH = scopeRef.current?.clientHeight || window.innerHeight * 0.75;
			canvas.width = Math.floor(parentW * dpr);
			canvas.height = Math.floor(scopeH * dpr);
			canvas.style.width = parentW + 'px';
			canvas.style.height = scopeH + 'px';
			ctx.setTransform(1,0,0,1,0,0);
			ctx.scale(dpr, dpr);
			return { width: parentW, height: scopeH };
		};

		let { width, height } = computeSize();

		const STAR_COUNT = Math.min(480, Math.floor((width * height) / 2800));
		let stars: Star[] = [];

		const initStars = () => {
			stars = Array.from({ length: STAR_COUNT }, () => ({
				x: (Math.random() - 0.5) * width * 2,
				y: (Math.random() - 0.5) * height * 2,
				z: Math.random() * width,
				r: Math.random() * 1.2 + 0.2,
				speed: Math.random() * 0.4 + 0.15
			}));
		};

		const resize = () => {
			({ width, height } = computeSize());
			initStars();
		};

		window.addEventListener('resize', resize);
		initStars();

		const render = () => {
			ctx.clearRect(0, 0, width, height);
			ctx.globalCompositeOperation = 'lighter';
			for (const s of stars) {
				s.z -= s.speed;
				if (s.z <= 1) s.z = width;
				const k = 128 / s.z;
				const px = s.x * k + width / 2;
				const py = s.y * k + height / 2;
				if (px < 0 || px > width || py < 0 || py > height) continue;
				const alpha = Math.min(1, (1 - s.z / width) + 0.15);
				const size = s.r * k * 0.9;
				const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 2.2);
				grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
				grad.addColorStop(0.4, `rgba(67,233,255,${alpha * 0.9})`);
				grad.addColorStop(1, 'rgba(255,63,180,0)');
				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(px, py, size * 2.2, 0, Math.PI * 2);
				ctx.fill();
			}
			rafRef.current = requestAnimationFrame(render);
		};
		render();

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, []);

	// Fragmentos flotantes (pequeños rectángulos animados)
	const fragmentsRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const container = fragmentsRef.current;
		if (!container) return;
		const TOTAL = 14;
		for (let i = 0; i < TOTAL; i++) {
			const el = document.createElement('span');
			el.className = 'fragment';
			const startX = Math.random() * 100;
			const startY = Math.random() * 100;
			const driftX = startX + (Math.random() * 20 - 10);
			const driftY = startY - (Math.random() * 30 + 20);
			el.style.setProperty('--xStart', `${startX}vw`);
			el.style.setProperty('--yStart', `${startY}vh`);
			el.style.setProperty('--xEnd', `${driftX}vw`);
			el.style.setProperty('--yEnd', `${driftY}vh`);
			el.style.animationDuration = `${10 + Math.random() * 14}s`;
			el.style.animationDelay = `${Math.random() * -10}s`;
			container.appendChild(el);
		}
		return () => { container.innerHTML = ''; };
	}, []);

	// Parallax interactividad
	useEffect(() => {
		const scope = scopeRef.current;
		if (!scope) return;
		const onMove = (e: PointerEvent) => {
			const rect = scope.getBoundingClientRect();
			const mx = (e.clientX - rect.left) / rect.width - 0.5;
			const my = (e.clientY - rect.top) / rect.height - 0.5;
			scope.style.setProperty('--parX', (mx * 14).toString());
			scope.style.setProperty('--parY', (my * 14).toString());
			const img = scope.querySelector<HTMLElement>('.hero-main-img-inner');
			if (img) {
				img.style.transform = `rotateX(${my * -6}deg) rotateY(${mx * 8}deg) translateZ(0)`;
			}
		};
		scope.addEventListener('pointermove', onMove);
		return () => scope.removeEventListener('pointermove', onMove);
	}, []);

	return (
		<section ref={scopeRef} className="hero-scope">
			<canvas ref={canvasRef} className="hero-space-canvas" />
			<div className="floating-fragments" ref={fragmentsRef} />
			<div className="hero-decor-orb orb-1" />
			<div className="hero-decor-orb orb-2" />
			<div className="hero-main-container">
				<div className="hero-main-img">
					<div className="hero-main-img-inner">
						<img src="/img/hero1.jpeg" alt="Celestia Graph Hero" />
					</div>
				</div>
				<div className="hero-main-info">
					<h1 className="hero-main-title">
						Explora el universo modular de Celestia Graph
					</h1>
					<p className="hero-main-desc">
						Mapeamos entidades, bloques y relaciones emergentes dentro del ecosistema modular
						para que puedas detectar patrones, anomalías y dinámicas de propagación de datos
						en segundos. Visualización impulsada por rendimiento: canvas, proyección espacial,
						animaciones adaptativas y una capa interactiva que responde a tu movimiento.
						<br /><br />
						<span style={{ color: '#ff3fb4' }}>
							Esto no es solo un visor: es un laboratorio dinámico de exploración on-chain.
						</span>
					</p>
					<div className="hero-main-badges">
						<span className="hero-badge">Grafo Dinámico</span>
						<span className="hero-badge">Análisis Modular</span>
						<span className="hero-badge">Stream Tiempo Real</span>
						<span className="hero-badge">Interactividad Parallax</span>
					</div>
					<div className="hero-main-cta">
						<button className="hero-main-cta-btn">Probar Demo</button>
						<button className="hero-main-cta-btn secondary">Ver Documentación</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroMain;
