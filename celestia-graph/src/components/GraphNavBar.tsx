import React, { useEffect, useState, useRef } from 'react';

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

	const [notifications, setNotifications] = useState(() => ([
		{ id: 1, title: 'Nuevo nodo detectado', ts: 'hace 2m', unread: true, type: 'INFO' },
		{ id: 2, title: 'Alerta: actividad irregular', ts: 'hace 14m', unread: true, type: 'ALERT' },
		{ id: 3, title: 'Índice sincronizado', ts: 'hace 1h', unread: false, type: 'SYS' }
	]));

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

	const submitQuick = (e: React.FormEvent) => {
		e.preventDefault();
		console.log('Quick search:', search);
	};

	const applyAdvanced = () => {
		console.log('Advanced search params:', adv);
		setShowAdv(false);
	};

	const updateAdv = (patch: Partial<AdvancedParams>) =>
		setAdv(a => ({ ...a, ...patch }));

	const markRead = (id: number) =>
		setNotifications(n => n.map(nn => nn.id === id ? { ...nn, unread: false } : nn));

	const markAll = () =>
		setNotifications(n => n.map(nn => ({ ...nn, unread: false })));

	return (
		<>
			<header className="graph-nav">
				<div className="graph-nav-brand">Graph Console</div>

				<form className="graph-nav-form" onSubmit={submitQuick} role="search" aria-label="Búsqueda rápida">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<circle cx="11" cy="11" r="7" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						name="quick"
						type="text"
						placeholder="Buscar en grafo..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						aria-label="Buscar"
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
						Búsqueda avanzada
					</button>
					<button
						type="button"
						className="gbtn primary"
						onClick={submitQuick as any}
					>
						Buscar
					</button>
					<button
						type="button"
						className="gbtn"
						aria-label="Notificaciones"
						onClick={() => setShowNotif(true)}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
							<path d="M13.73 21a2 2 0 0 1-3.46 0" />
						</svg>
						{notifications.some(n => n.unread) && (
							<span style={{
								position: 'absolute',
								top: 4,
								right: 4,
								width: 8,
								height: 8,
								background: 'linear-gradient(90deg,#ff3fb4,#ffb347)',
								borderRadius: '50%',
								boxShadow: '0 0 6px 2px #ff3fb455'
							}} />
						)}
					</button>
					<a
						className="gbtn"
						href="/"
						style={{ textDecoration: 'none' }}
					>Inicio</a>
				</div>
			</header>

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
						<h3 id="adv-modal-title">Búsqueda avanzada</h3>
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

			{/* Panel de notificaciones */}
			{showNotif && (
				<>
					<div className="notify-overlay" onClick={() => setShowNotif(false)} />
					<aside className="notify-panel" aria-label="Panel de notificaciones">
						<div className="notify-head">
							<h4>Notificaciones</h4>
							<div style={{ display: 'flex', gap: '.4rem' }}>
								<button
									className="gbtn"
									style={{ fontSize: '.55rem', padding: '.4rem .7rem' }}
									onClick={markAll}
								>Marcar leídas</button>
								<button
									className="gbtn"
									style={{ fontSize: '.55rem', padding: '.4rem .7rem' }}
									onClick={() => setShowNotif(false)}
								>Cerrar</button>
							</div>
						</div>
						<ul className="notify-list">
							{notifications.map(n => (
								<li key={n.id} className={`notification ${n.unread ? 'unread' : ''}`}>
									<span className="nbadge">{n.type}</span>
									<div>{n.title}</div>
									<small>{n.ts}</small>
									{n.unread && (
										<button
											className="mark-read-btn"
											onClick={() => markRead(n.id)}
										>Marcar leído</button>
									)}
								</li>
							))}
						</ul>
					</aside>
				</>
			)}
		</>
	);
};

export default GraphNavBar;
