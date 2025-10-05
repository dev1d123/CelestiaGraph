import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '../context/CartContext'; // nuevo
import { useNavigate } from 'react-router-dom'; // nuevo
import { dummyArticles } from '../data/dummyArticles'; // nuevo

const injectGraphNavStyles = () => {
	if (document.getElementById('graph-nav-styles')) return;
	const style = document.createElement('style');
	style.id = 'graph-nav-styles';
	style.textContent = `
	.graph-nav {
		position: sticky;
		top: 0;
		z-index: 120;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: .75rem clamp(1rem,2vw,2.1rem);
		background: linear-gradient(160deg, rgba(18,28,46,.82), rgba(10,16,28,.82));
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		border-bottom: 1px solid #ffffff14;
		box-shadow: 0 4px 28px -14px #000;
	}
	.graph-nav-brand {
		font-family: 'Saira', sans-serif;
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: 1px;
		text-transform: uppercase;
		background: linear-gradient(90deg,#43e9ff,#ff3fb4 65%,#b4ff4d);
		-webkit-background-clip: text;
		color: transparent;
		user-select: none;
	}
	.graph-nav-form {
		flex: 1;
		display: flex;
		align-items: stretch;
		position: relative;
	}
	.graph-nav-form input {
		flex: 1;
		background: #0d1626;
		border: 1px solid #1f334d;
		color: var(--text-main);
		font: inherit;
		padding: .62rem .9rem .62rem 2.2rem;
		border-radius: .85rem;
		outline: none;
		transition: border-color var(--transition-fast), background var(--transition-fast);
	}
	.graph-nav-form input:focus {
		border-color: #43e9ff;
		background: #122235;
		box-shadow: var(--focus-ring);
	}
	.graph-nav-form svg {
		position: absolute;
		left: .65rem;
		top: 50%;
		translate: 0 -50%;
		width: 1.1rem;
		height: 1.1rem;
		color: #7f92a8;
		pointer-events: none;
	}
	.graph-nav-buttons {
		display: flex;
		align-items: center;
		gap: .6rem;
	}
	.gbtn {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: .45rem;
		padding: .6rem 1.05rem;
		font-size: .78rem;
		font-weight: 600;
		letter-spacing: .5px;
		border: 1px solid #1f334d;
		border-radius: .85rem;
		background: linear-gradient(120deg,#102132,#0f1c2b);
		color: var(--text-dim);
		cursor: pointer;
		transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast), transform 140ms;
	}
	.gbtn:hover {
		color: var(--text-main);
		border-color: #2b4e72;
	}
	.gbtn:active {
		transform: translateY(1px);
	}
	.gbtn:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}
	.gbtn.primary {
		background: linear-gradient(90deg,#43e9ff,#ff3fb4);
		color: #0c1420;
		border-color: #43e9ff;
		font-weight: 700;
	}
	.gbtn.primary:hover {
		filter: brightness(1.08);
	}
	.cart-badge {
		position: absolute;
		top: 4px;
		right: 6px;
		background: linear-gradient(90deg,#ff3fb4,#ffb347);
		color: #09131d;
		font-size: .55rem;
		padding: .15rem .4rem .22rem;
		border-radius: 1rem;
		font-weight: 700;
		letter-spacing: .5px;
		box-shadow: 0 0 0 1px #ffffff22, 0 0 10px -2px #ff62d0;
		min-width: 20px;
		text-align: center;
	}
	/* Modal */
	.adv-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,.55);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 6vh 1rem 2rem;
		z-index: 400;
		animation: fadeIn .3s ease;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	.adv-modal {
		width: min(860px,100%);
		background: linear-gradient(160deg,#0f1e30,#0b1626);
		border: 1px solid #204060;
		border-radius: 1.2rem;
		box-shadow: 0 18px 60px -20px #000, 0 0 0 1px #ffffff08;
		padding: 1.4rem 1.6rem 1.8rem;
		position: relative;
		animation: modalUp .35s cubic-bezier(.4,.2,.2,1);
	}
	@keyframes modalUp {
		from { opacity: 0; transform: translateY(30px) scale(.96); }
		to { opacity:1; transform: none; }
	}
	.adv-modal h3 {
		margin: 0 0 1.1rem;
		font-size: 1.05rem;
		letter-spacing: .5px;
		font-weight: 700;
		color: var(--text-main);
		display: flex;
		align-items: center;
		gap: .6rem;
	}
	.adv-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit,minmax(210px,1fr));
		gap: 1rem 1.1rem;
		margin-bottom: 1.2rem;
	}
	.afield {
		display: flex;
		flex-direction: column;
		gap: .35rem;
	}
	.afield label {
		font-size: .65rem;
		letter-spacing: .8px;
		text-transform: uppercase;
		font-weight: 600;
		color: #7f92a8;
	}
	.afield input,
	.afield select,
	.afield textarea {
		background: #0d1a28;
		border: 1px solid #1f334d;
		color: var(--text-main);
		font: inherit;
		border-radius: .6rem;
		padding: .55rem .65rem;
		resize: vertical;
		min-height: 38px;
		transition: border-color var(--transition-fast), background var(--transition-fast);
	}
	.afield input:focus,
	.afield select:focus,
	.afield textarea:focus {
		outline: none;
		border-color: #43e9ff;
		background: #122435;
		box-shadow: 0 0 0 2px #09131f, 0 0 0 4px #43e9ff44;
	}
	.logic-group {
		display: flex;
		gap: .5rem;
		flex-wrap: wrap;
	}
	.logic-group button {
		flex: 1;
		min-width: 70px;
	}
	.badge-chip {
		display: inline-flex;
		align-items: center;
		gap: .4rem;
		background: #132739;
		border: 1px solid #25405a;
		color: #b7cee1;
		font-size: .65rem;
		padding: .35rem .6rem;
		border-radius: 1rem;
		letter-spacing: .5px;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: .6rem;
		margin-top: .4rem;
	}
	.close-x {
		position: absolute;
		top: .6rem;
		right: .65rem;
		background: transparent;
		border: 0;
		color: #7f92a8;
		font-size: 1.1rem;
		cursor: pointer;
		padding: .35rem;
		line-height: 1;
		border-radius: .6rem;
		transition: background var(--transition-fast), color var(--transition-fast);
	}
	.close-x:hover {
		color: var(--text-main);
		background: #1b2c40;
	}
	/* Notifications panel */
	.notify-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,.35);
		z-index: 380;
		backdrop-filter: blur(2px);
		animation: fadeIn .25s ease;
	}
	.notify-panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100%;
		width: min(360px, 94vw);
		background: linear-gradient(170deg,#0d1825,#0b1320);
		border-left: 1px solid #1e3955;
		box-shadow: -10px 0 28px -18px #000;
		display: flex;
		flex-direction: column;
		z-index: 400;
		transform: translateX(100%);
		animation: slideIn .35s cubic-bezier(.4,.2,.2,1) forwards;
	}
	@keyframes slideIn {
		to { transform: translateX(0); }
	}
	.notify-head {
		padding: .95rem 1.05rem .8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #1f334a;
	}
	.notify-head h4 {
		margin: 0;
		font-size: .85rem;
		font-weight: 700;
		letter-spacing: .7px;
		text-transform: uppercase;
	}
	.notify-list {
		list-style: none;
		margin: 0;
		padding: .75rem .65rem 1.2rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: .55rem;
	}
	.notification {
		position: relative;
		padding: .6rem .7rem .7rem .85rem;
		border: 1px solid #22384e;
		border-radius: .9rem;
		background: #102031;
		font-size: .7rem;
		line-height: 1.35;
		display: flex;
		flex-direction: column;
		gap: .3rem;
	}
	.notification.unread {
		border-color: #2d5577;
		box-shadow: 0 0 0 1px #2d557744;
	}
	.notification small {
		opacity: .6;
		font-size: .58rem;
		letter-spacing: .4px;
	}
	.nbadge {
		font-size: .55rem;
		padding: .25rem .5rem;
		border-radius: .6rem;
		letter-spacing: .7px;
		font-weight: 700;
		background: linear-gradient(90deg,#43e9ff22,#ff3fb422);
		border: 1px solid #264d66;
		align-self: flex-start;
	}
	.mark-read-btn {
		background: transparent;
		border: 0;
		color: #7f92a8;
		font-size: .55rem;
		cursor: pointer;
		align-self: flex-end;
		padding: .2rem .3rem;
		border-radius: .4rem;
		transition: background var(--transition-fast), color var(--transition-fast);
	}
	.mark-read-btn:hover {
		color: var(--text-main);
		background: #1a2d42;
	}
	/* Utility hidden */
	.hidden { display: none !important; }
	@media (max-width: 780px) {
		.graph-nav-form { order: 3; width: 100%; }
		.graph-nav { flex-wrap: wrap; }
		.graph-nav-buttons { margin-left: auto; }
	}
	`;
	document.head.appendChild(style);
};

type AdvancedParams = {
	q: string;
	exact: string;
	exclude: string;
	author: string;
	tags: string;
	dateFrom: string;
	dateTo: string;
	logic: 'AND' | 'OR';
	minHeight: string;
	maxHeight: string;
	includeMeta: boolean;
	limit: string;
};

const initialAdv: AdvancedParams = {
	q: '',
	exact: '',
	exclude: '',
	author: '',
	tags: '',
	dateFrom: '',
	dateTo: '',
	logic: 'AND',
	minHeight: '',
	maxHeight: '',
	includeMeta: true,
	limit: '50'
};

const GraphNavBar: React.FC = () => {
	const [search, setSearch] = useState('');
	const [showAdv, setShowAdv] = useState(false);
	const [showNotif, setShowNotif] = useState(false);
	const [adv, setAdv] = useState<AdvancedParams>(initialAdv);
	const advRef = useRef<HTMLDivElement | null>(null);

	const { items } = useCart(); // nuevo
	const navigate = useNavigate(); // nuevo

	const [notifications, setNotifications] = useState(() => ([
		{ id: 1, title: 'Nuevo nodo detectado', ts: 'hace 2m', unread: true, type: 'INFO' },
		{ id: 2, title: 'Alerta: actividad irregular', ts: 'hace 14m', unread: true, type: 'ALERT' },
		{ id: 3, title: 'Índice sincronizado', ts: 'hace 1h', unread: false, type: 'SYS' }
	]));

	const [results, setResults] = useState<any[]>([]); // nuevo
	const [showResults, setShowResults] = useState(false); // nuevo
	const [searchLoading, setSearchLoading] = useState(false); // nuevo
	const resultsRef = useRef<HTMLDivElement | null>(null); // nuevo

	// inyectar estilos extra para resultados
	useEffect(() => {
		const id = 'graph-nav-results-styles';
		if (document.getElementById(id)) return;
		const st = document.createElement('style');
		st.id = id;
		st.textContent = `
		.gs-results-wrapper {
			position: relative;
			z-index: 90;
		}
		.gs-results-panel {
			position: absolute;
			left: 0;
			top: 100%;
			margin-top: .4rem;
			width: min(1120px, calc(100vw - 2rem));
			background: linear-gradient(150deg,#0d1827,#101e32 55%,#0a1522);
			border: 1px solid #203446;
			border-radius: 1rem;
			box-shadow: 0 18px 50px -20px #000, 0 0 0 1px #ffffff0f;
			padding: 1rem 1.1rem 1.2rem;
			backdrop-filter: blur(14px) saturate(160%);
			-webkit-backdrop-filter: blur(14px) saturate(160%);
			max-height: 70vh;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: .9rem;
			animation: fadeIn .35s ease;
		}
		.gs-result {
			display: flex;
			flex-direction: column;
			gap: .35rem;
			padding: .55rem .7rem .7rem;
			border: 1px solid #1d3246;
			border-radius: .75rem;
			background: linear-gradient(120deg,#132534,#0f1d2b);
			font-size: .63rem;
			line-height: 1.45;
			position: relative;
			transition: border-color .25s, background .25s;
		}
		.gs-result:hover {
			border-color: #2b4e72;
			background: linear-gradient(120deg,#163042,#102231);
		}
		.gs-title {
			font-size: .74rem;
			font-weight: 600;
			letter-spacing: .4px;
			color: #cfe6ff;
			text-decoration: none;
			line-height: 1.25;
		}
		.gs-title:hover { color: #ffffff; }
		.gs-authors {
			opacity: .75;
			font-size: .58rem;
			letter-spacing: .35px;
		}
		.gs-meta {
			display: flex;
			flex-wrap: wrap;
			gap: .45rem;
			font-size: .52rem;
			opacity: .7;
			letter-spacing: .5px;
		}
		.gs-badge {
			background: #173049;
			border: 1px solid #254861;
			color: #8fb6ff;
			padding: .25rem .5rem;
			border-radius: .6rem;
			font-size: .52rem;
			letter-spacing: .6px;
			font-weight: 600;
		}
		.gs-cite {
			color: #ffcf7b;
			font-weight: 600;
		}
		.gs-abstract {
			font-size: .56rem;
			letter-spacing: .35px;
			color: #b8d2ea;
			max-width: 1000px;
		}
		.gs-highlight {
			background: #ff3fb422;
			color: #ffaad9;
			padding: 0 .15rem;
			border-radius: .25rem;
		}
		.gs-controls {
			display:flex;
			align-items:center;
			justify-content:space-between;
			gap:.8rem;
			padding: .2rem .35rem .4rem;
			border-bottom:1px solid #22374a;
			margin-bottom: .4rem;
		}
		.gs-controls small {
			font-size: .55rem;
			color:#9ab9d3;
			letter-spacing:.5px;
		}
		.gs-close-btn {
			background:#172a3b;
			color:#8fb6ff;
			border:1px solid #28425a;
			font-size:.55rem;
			padding:.4rem .65rem;
			border-radius:.55rem;
			cursor:pointer;
			font-weight:600;
			letter-spacing:.5px;
			transition:background .25s,color .25s;
		}
		.gs-close-btn:hover { background:#203d52; color:#d8ecff; }
		.gs-empty {
			text-align:center;
			opacity:.5;
			font-size:.6rem;
			padding:1rem 0 .6rem;
		}
		@media (max-width: 920px){
			.gs-results-panel { position: fixed; left:50%; transform:translateX(-50%); top: 74px; width: min(1000px,96vw); }
		}
		`;
		document.head.appendChild(st);
	}, []);

	// helper highlight
	const highlight = (text: string, terms: string[]) => {
		if (!terms.length) return text;
		let safe = text;
		terms
			.filter(t => t.trim().length > 1)
			.forEach(t => {
				const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
				safe = safe.replace(r, '<span class="gs-highlight">$1</span>');
			});
		return <span dangerouslySetInnerHTML={{ __html: safe }} />;
	};

	const tokenize = (v: string) =>
		v.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);

	const performSearch = (advParams?: typeof adv) => {
		setSearchLoading(true);
		const base = dummyArticles.slice();
		const p = advParams || { ...adv, q: search };
		const qTokens = tokenize(p.q.toLowerCase());
		const excTokens = tokenize(p.exclude.toLowerCase());
		const tagsTokens = tokenize(p.tags.toLowerCase());
		const logicAnd = p.logic === 'AND';

		let filtered = base.filter(a => {
			const haystack = (a.title + ' ' + a.abstract + ' ' + a.tags.join(' ')).toLowerCase();

			// q tokens
			if (qTokens.length) {
				const matchTokens = qTokens.map(t => haystack.includes(t));
				if (logicAnd && matchTokens.some(m => !m)) return false;
				if (!logicAnd && matchTokens.every(m => !m)) return false;
			}

			// exact phrase
			if (p.exact.trim()) {
				if (!haystack.includes(p.exact.toLowerCase())) return false;
			}

			// exclude
			if (excTokens.some(t => t && haystack.includes(t))) return false;

			// author
			if (p.author.trim()) {
				const auth = p.author.toLowerCase();
				if (!a.authors.some(au => au.toLowerCase().includes(auth))) return false;
			}

			// tags
			if (tagsTokens.length) {
				const lowerTags = a.tags.map(t => t.toLowerCase());
				const all = tagsTokens.every(tt => lowerTags.includes(tt));
				if (!all) return false;
			}

			// height
			if (p.minHeight && a.height < Number(p.minHeight)) return false;
			if (p.maxHeight && a.height > Number(p.maxHeight)) return false;

			// date range
			if (p.dateFrom && a.date < p.dateFrom) return false;
			if (p.dateTo && a.date > p.dateTo) return false;

			return true;
		});

		// orden preferente: citas desc, año desc
		filtered.sort((a, b) => b.citations - a.citations || b.year - a.year);

		// limitar
		const limit = parseInt(p.limit, 10) || 50;
		filtered = filtered.slice(0, limit);

		// map render meta/hits
		const termsForHighlight = [...qTokens];
		if (p.exact) termsForHighlight.push(p.exact);
		const mapped = filtered.map(f => ({
			...f,
			_hTitle: highlight(f.title, termsForHighlight),
			_hAbstract: highlight(f.abstract, termsForHighlight)
		}));

		setTimeout(() => {
			setResults(mapped);
			setShowResults(true);
			setSearchLoading(false);
		}, 250 + Math.random()*250); // delay simulado
	};

	// quick submit
	const submitQuick = (e: React.FormEvent) => {
		e.preventDefault();
		performSearch();
	};

	// override advanced apply
	const applyAdvanced = () => {
		performSearch(adv);
		setShowAdv(false);
	};

	// cerrar resultados al click fuera
	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!resultsRef.current) return;
			if (!resultsRef.current.contains(e.target as Node) &&
				!(e.target as HTMLElement).closest('.graph-nav-form')) {
				// opcional: setShowResults(false);
			}
		};
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, []);

	useEffect(() => {
		injectGraphNavStyles();
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setShowAdv(false);
				setShowNotif(false);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		if (showAdv) {
			setTimeout(() => {
				advRef.current?.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
			}, 10);
		}
	}, [showAdv]);

	const updateAdv = (patch: Partial<AdvancedParams>) =>
		setAdv(a => ({ ...a, ...patch }));

	const markRead = (id: number) =>
		setNotifications(n => n.map(nn => nn.id === id ? { ...nn, unread: false } : nn));

	const markAll = () =>
		setNotifications(n => n.map(nn => ({ ...nn, unread: false })));

	return (
		<>
			<header className="graph-nav">

				<form className="graph-nav-form" onSubmit={submitQuick} role="search" aria-label="Búsqueda rápida">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<circle cx="11" cy="11" r="7" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						name="quick"
						type="text"
						placeholder="Search an article..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						onKeyDown={e => { if (e.key === 'Escape') setShowResults(false); }}
						aria-label="Search"
					/>
				</form>

				<div className="graph-nav-buttons">
					<button
						type="button"
						className="gbtn"
						onClick={() => setShowAdv(true)}
						aria-haspopup="dialog"
						aria-expanded={showAdv}
					>
						<span style={{ display: 'inline-flex' }}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M3 5h18M6 12h12M10 19h4" />
							</svg>
						</span>
						Advanced search
					</button>
					<button
						type="button"
						className="gbtn primary"
						onClick={submitQuick as any}
					>
						Search
					</button>
					<button
						type="button"
						className="gbtn"
						onClick={() => navigate('/cart')}
						aria-label="Carrito"
						style={{ position: 'relative' }}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
						</svg>
						List
						{items.length > 0 && <span className="cart-badge">{items.length}</span>}
					</button>
					<a
						className="gbtn"
						href="/"
						style={{ textDecoration: 'none' }}
					>Home</a>
				</div>
			</header>

			{/* Panel de resultados */}
			{showResults && (
				<div className="gs-results-wrapper" ref={resultsRef} style={{ position:'relative' }}>
					<div className="gs-results-panel">
						<div className="gs-controls">
							<small>
								{searchLoading
									? 'Buscando...'
									: results.length
										? `${results.length} resultados (dummy)`
										: 'Sin resultados'}
							</small>
							<div style={{display:'flex', gap:'.4rem'}}>
								<button
									className="gs-close-btn"
									onClick={() => setShowResults(false)}
								>Cerrar</button>
								<button
									className="gs-close-btn"
									style={{background:'#1c3145'}}
									onClick={() => {
										setSearch('');
										setResults([]);
									}}
								>Reset</button>
							</div>
						</div>
						{!results.length && !searchLoading && (
							<div className="gs-empty">Intenta ajustar términos o abrir la búsqueda avanzada.</div>
						)}
						{results.map(r => (
							<article key={r.id} className="gs-result">
								<a href="#" className="gs-title">{r._hTitle}</a>
								<div className="gs-authors">
									{r.authors.join(', ')} — {r.venue} ({r.year})
								</div>
								<div className="gs-meta">
									<span className="gs-badge gs-cite">Citas: {r.citations}</span>
									<span className="gs-badge">Altura {r.height}</span>
									<span className="gs-badge">Fecha {r.date}</span>
									{r.tags.slice(0,4).map(t => <span key={t} className="gs-badge">{t}</span>)}
								</div>
								<div className="gs-abstract">
									{r._hAbstract}{' '}
									<span style={{opacity:.45}}>
										{adv.includeMeta ? ` [meta:${r.id}]` : ''}
									</span>
								</div>
							</article>
						))}
					</div>
				</div>
			)}

			{/* Modal de búsqueda avanzada */}
			{showAdv && (
				<div
					className="adv-modal-backdrop"
					onClick={() => setShowAdv(false)}
				>
					<div
						className="adv-modal"
						ref={advRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby="adv-modal-title"
						onClick={e => e.stopPropagation()}
					>
						<button
							className="close-x"
							aria-label="Cerrar"
							onClick={() => setShowAdv(false)}
						>×</button>
						<h3 id="adv-modal-title">Advanced Search</h3>
						<div className="adv-grid">
							{/* ...existing code (campos) ... */}
							<div className="afield">
								<label>Palabras clave</label>
								<input
									name="q"
									value={adv.q}
									onChange={e => updateAdv({ q: e.target.value })}
									placeholder="ej: modular consenso blobs"
								/>
							</div>
							<div className="afield">
								<label>Frase exacta</label>
								<input
									value={adv.exact}
									onChange={e => updateAdv({ exact: e.target.value })}
									placeholder="cadena exacta"
								/>
							</div>
							<div className="afield">
								<label>Excluir</label>
								<input
									value={adv.exclude}
									onChange={e => updateAdv({ exclude: e.target.value })}
									placeholder="palabras NO"
								/>
							</div>
							<div className="afield">
								<label>Autor</label>
								<input
									value={adv.author}
									onChange={e => updateAdv({ author: e.target.value })}
									placeholder="@handle / id"
								/>
							</div>
							<div className="afield">
								<label>Tags</label>
								<input
									value={adv.tags}
									onChange={e => updateAdv({ tags: e.target.value })}
									placeholder="tag1,tag2"
								/>
							</div>
							<div className="afield">
								<label>Desde (fecha)</label>
								<input
									type="date"
									value={adv.dateFrom}
									onChange={e => updateAdv({ dateFrom: e.target.value })}
								/>
							</div>
							<div className="afield">
								<label>Hasta (fecha)</label>
								<input
									type="date"
									value={adv.dateTo}
									onChange={e => updateAdv({ dateTo: e.target.value })}
								/>
							</div>
							<div className="afield">
								<label>Op. lógica</label>
								<select
									value={adv.logic}
									onChange={e => updateAdv({ logic: e.target.value as 'AND' | 'OR' })}
								>
									<option value="AND">AND (todas)</option>
									<option value="OR">OR (cualquiera)</option>
								</select>
							</div>
							<div className="afield">
								<label>Altura mín.</label>
								<input
									type="number"
									value={adv.minHeight}
									onChange={e => updateAdv({ minHeight: e.target.value })}
									placeholder="ej: 1200"
								/>
							</div>
							<div className="afield">
								<label>Altura máx.</label>
								<input
									type="number"
									value={adv.maxHeight}
									onChange={e => updateAdv({ maxHeight: e.target.value })}
									placeholder="ej: 99999"
								/>
							</div>
							<div className="afield">
								<label>Límite</label>
								<select
									value={adv.limit}
									onChange={e => updateAdv({ limit: e.target.value })}
								>
									<option>25</option>
									<option>50</option>
									<option>100</option>
									<option>250</option>
								</select>
							</div>
							<div className="afield">
								<label>Extras</label>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
									<label style={{ fontSize: '.65rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
										<input
											type="checkbox"
											checked={adv.includeMeta}
											onChange={e => updateAdv({ includeMeta: e.target.checked })}
											style={{ accentColor: '#43e9ff' }}
										/>
										Incluir metadata
									</label>
									<span className="badge-chip">Expansión semántica futura</span>
								</div>
							</div>
						</div>
						<div className="logic-group" style={{ marginBottom: '.9rem' }}>
							<button
								type="button"
								className={`gbtn ${adv.logic === 'AND' ? 'primary' : ''}`}
								onClick={() => updateAdv({ logic: 'AND' })}
							>AND</button>
							<button
								type="button"
								className={`gbtn ${adv.logic === 'OR' ? 'primary' : ''}`}
								onClick={() => updateAdv({ logic: 'OR' })}
							>OR</button>
							<button
								type="button"
								className="gbtn"
								onClick={() => setAdv(initialAdv)}
							>Reset</button>
						</div>
						<div className="modal-actions">
							<button type="button" className="gbtn" onClick={() => setShowAdv(false)}>Cancelar</button>
							<button type="button" className="gbtn primary" onClick={applyAdvanced}>Aplicar</button>
						</div>
					</div>
				</div>
			)}

			
		</>
	);
};

export default GraphNavBar;
