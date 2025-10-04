import React, { useState, useEffect } from 'react';

const injectNavStyles = () => {
	if (document.getElementById('nav-styles')) return;
	const style = document.createElement('style');
	style.id = 'nav-styles';
	style.textContent = `
	.nav-root {
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(18px) saturate(170%);
		-webkit-backdrop-filter: blur(18px) saturate(170%);
		background: var(--bg-panel);
		border-bottom: 1px solid rgba(130,160,255,0.12);
		box-shadow: 0 4px 22px -10px rgba(0,0,0,0.65);
	}
	.nav-inner {
		max-width: 1220px;
		margin: 0 auto;
		padding: .85rem clamp(1rem,2.2vw,2.2rem);
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	.nav-brand {
		display: flex;
		align-items: center;
		font-family: 'Underdog', cursive;
		font-size: 1.35rem;
		letter-spacing: .5px;
		background: var(--grad-accent);
		-webkit-background-clip: text;
		color: transparent;
		text-shadow: 0 0 10px rgba(67,233,255,0.35);
		user-select: none;
	}
	.nav-spacer { flex: 1; }
	.nav-links {
		list-style: none;
		display: flex;
		align-items: center;
		gap: clamp(.4rem,1.6vw,2.2rem);
		margin: 0;
		padding: 0;
	}
	.nav-links a {
		position: relative;
		display: inline-flex;
		align-items: center;
		font-size: .93rem;
		font-weight: 500;
		padding: .55rem .95rem;
		letter-spacing: .4px;
		color: var(--text-dim);
		text-decoration: none;
		text-transform: uppercase;
		transition: color var(--transition-fast), transform var(--transition-fast);
		isolation: isolate;
	}
	.nav-links a::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid rgba(120,160,255,0.22);
		border-radius: 9px;
		background:
			linear-gradient(150deg, rgba(255,255,255,0.08), rgba(255,255,255,0)),
			radial-gradient(circle at 65% 15%, rgba(67,233,255,0.25), transparent 70%);
		opacity: 0;
		transform: scale(.7);
		transition: all var(--transition-fast);
	}
	.nav-links a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 9px;
		padding: 1px;
		background: var(--grad-accent);
		opacity: 0;
		mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
		-webkit-mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
		mask-composite: exclude;
		-webkit-mask-composite: xor;
		transition: opacity var(--transition-fast);
	}
	.nav-links a:hover,
	.nav-links a:focus-visible { color: var(--text-main); }
	.nav-links a:hover::before,
	.nav-links a:focus-visible::before {
		opacity: 1;
		transform: scale(1);
	}
	.nav-links a:hover::after,
	.nav-links a:focus-visible::after { opacity: .9; }
	.nav-links a:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
		border-radius: 10px;
	}
	.hamburger {
		display: none;
		position: relative;
		width: 44px;
		height: 44px;
		border: 1px solid rgba(120,160,255,0.25);
		border-radius: 12px;
		background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
		color: var(--text-main);
		cursor: pointer;
		align-items: center;
		justify-content: center;
		transition: background var(--transition-fast), border-color var(--transition-fast);
	}
	.hamburger:hover { border-color: rgba(120,160,255,0.55); }
	.hamburger:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}
	.hamburger-lines {
		width: 20px;
		height: 14px;
		position: relative;
	}
	.hamburger-lines span {
		position: absolute;
		left: 0;
		width: 100%;
		height: 2px;
		background: var(--grad-accent);
		border-radius: 2px;
		transition: transform 260ms cubic-bezier(.65,.05,.36,1), top 260ms, opacity 180ms;
	}
	.hamburger-lines span:nth-child(1) { top: 0; }
	.hamburger-lines span:nth-child(2) { top: 6px; }
	.hamburger-lines span:nth-child(3) { top: 12px; }
	.hamburger[data-open='true'] span:nth-child(1) { top: 6px; transform: rotate(42deg); }
	.hamburger[data-open='true'] span:nth-child(2) { opacity: 0; transform: translateX(-6px); }
	.hamburger[data-open='true'] span:nth-child(3) { top: 6px; transform: rotate(-42deg); }
	@media (max-width: 820px) {
		.nav-inner { gap: 1rem; }
		.nav-links {
			position: absolute;
			top: 100%;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			padding: .9rem;
			width: min(78vw, 320px);
			backdrop-filter: blur(22px) saturate(190%);
			-webkit-backdrop-filter: blur(22px) saturate(190%);
			background: linear-gradient(160deg, rgba(24,30,48,0.92), rgba(12,16,28,0.85));
			border: 1px solid rgba(120,160,255,0.22);
			border-top: 0;
			border-radius: 0 0 18px 18px;
			box-shadow: 0 18px 40px -14px rgba(0,0,0,0.65), var(--shadow-glow);
			translate: 0 -12px;
			opacity: 0;
			pointer-events: none;
			gap: .35rem;
			transition: opacity 280ms ease, translate 300ms cubic-bezier(.4,.2,.2,1);
		}
		.nav-links[data-open='true'] {
			opacity: 1;
			translate: 0 0;
			pointer-events: auto;
		}
		.nav-links a {
			width: 100%;
			font-size: .85rem;
			padding: .85rem .9rem;
		}
		.hamburger { display: inline-flex; }
		.nav-spacer { flex: 1; }
	}
	`;
	document.head.appendChild(style);
};

export const NavBar: React.FC = () => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		injectNavStyles();
	}, []);

	useEffect(() => {
		const onResize = () => {
			if (window.innerWidth > 820 && open) setOpen(false);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [open]);

	useEffect(() => {
		document.body.style.overflow = open ? 'hidden' : '';
	}, [open]);

	const toggle = () => setOpen(o => !o);

	return (
		<nav className="nav-root" aria-label="Primary">
			<div className="nav-inner">
				<div className="nav-brand">Celestia Search</div>
				<div className="nav-spacer" />
				<button
					className="hamburger"
					aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
					aria-expanded={open}
					aria-controls="primary-navigation"
					data-open={open}
					type="button"
					onClick={toggle}
				>
					<div className="hamburger-lines">
						<span />
						<span />
						<span />
					</div>
				</button>
				<ul
					id="primary-navigation"
					className="nav-links"
					data-open={open}
					role="menubar"
				>
					<li role="none">
						<a role="menuitem" href="#about" onClick={() => setOpen(false)}>About us</a>
					</li>
					<li role="none">
						<a role="menuitem" href="#classic-search" onClick={() => setOpen(false)}>Classic search</a>
					</li>
					<li role="none">
						<a role="menuitem" href="#tree-search" onClick={() => setOpen(false)}>Tree search</a>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default NavBar;
