import React, { useMemo, useState } from 'react';
import { dummyArticles } from '../data/dummyArticles';

const ClassicalPage: React.FC = () => {
	const [q, setQ] = useState('');
	const [exact, setExact] = useState('');
	const [exclude, setExclude] = useState('');
	const [limit, setLimit] = useState(50);

	const tokens = useMemo(
		() => q.split(/[\s,]+/).map(t => t.trim()).filter(t => t.length > 1),
		[q]
	);
	const excludeTokens = useMemo(
		() => exclude.split(/[\s,]+/).map(t => t.trim()).filter(Boolean),
		[exclude]
	);

	const results = useMemo(() => {
		let arr = dummyArticles.filter(a => {
			const hay = (a.title + ' ' + a.abstract + ' ' + a.tags.join(' ') + ' ' + a.authors.join(' ')).toLowerCase();
			if (tokens.length) {
				if (tokens.some(t => !hay.includes(t.toLowerCase()))) return false;
			}
			if (exact && !hay.includes(exact.toLowerCase())) return false;
			if (excludeTokens.some(t => hay.includes(t.toLowerCase()))) return false;
			return true;
		});
		arr.sort((a,b) => b.citations - a.citations || b.year - a.year);
		return arr.slice(0, limit);
	}, [tokens, exact, excludeTokens, limit]);

	const highlight = (text: string) => {
		if (!tokens.length && !exact) return text;
		let html = text;
		[...tokens, exact].filter(Boolean).forEach(t => {
			const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
			html = html.replace(r, '<mark style="background:#ff3fb422;color:#ffb9e5;padding:0 .15rem;border-radius:.25rem;">$1</mark>');
		});
		return <span dangerouslySetInnerHTML={{ __html: html }} />;
	};

	return (
		<div style={{minHeight:'100vh', background:'linear-gradient(160deg,#09131d,#0e1c2c)'}}>
			 <main style={{maxWidth: '1100px', margin:'0 auto', padding:'1.2rem 1.1rem 3rem'}}>
				<h1 style={{margin:'0 0 1.2rem', fontSize:'1.45rem', letterSpacing:'.5px'}}>Classical Search</h1>
				<section style={{
					display:'grid',
					gap:'.9rem',
					gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',
					marginBottom:'1.4rem'
				}}>
					<div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
						<label style={{fontSize:'.65rem',letterSpacing:'.6px',textTransform:'uppercase'}}>Palabras clave (AND)</label>
						<input value={q} onChange={e=>setQ(e.target.value)} placeholder="modular data availability" style={inputStyle}/>
					</div>
					<div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
						<label style={{fontSize:'.65rem',letterSpacing:'.6px',textTransform:'uppercase'}}>Frase exacta</label>
						<input value={exact} onChange={e=>setExact(e.target.value)} placeholder="celestia rollups" style={inputStyle}/>
					</div>
					<div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
						<label style={{fontSize:'.65rem',letterSpacing:'.6px',textTransform:'uppercase'}}>Excluir</label>
						<input value={exclude} onChange={e=>setExclude(e.target.value)} placeholder="legacy,eth1" style={inputStyle}/>
					</div>
					<div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
						<label style={{fontSize:'.65rem',letterSpacing:'.6px',textTransform:'uppercase'}}>Límite</label>
						<select value={limit} onChange={e=>setLimit(Number(e.target.value))} style={inputStyle as any}>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</div>
				</section>
				<p style={{fontSize:'.7rem', opacity:.7, margin:'0 0 1rem'}}>
					Resultados: {results.length} (dummy). Orden: citas desc, año desc.
				</p>
				<ul style={{listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'.8rem'}}>
					{results.map(r => (
						<li key={r.id} style={cardStyle}>
							<h2 style={{margin:'0 0 .4rem', fontSize:'.95rem', letterSpacing:'.4px'}}>
								{highlight(r.title)}
							</h2>
							<div style={{fontSize:'.6rem', opacity:.8, marginBottom:'.4rem'}}>
								{r.authors.join(', ')} — {r.venue} ({r.year}) · Citas {r.citations}
							</div>
							<p style={{margin:0, fontSize:'.63rem', lineHeight:1.4}}>
								{highlight(r.abstract)}
							</p>
							<div style={{display:'flex', flexWrap:'wrap', gap:'.35rem', marginTop:'.55rem'}}>
								{r.tags.slice(0,6).map(t=>(
									<span key={t} style={tagStyle}>{t}</span>
								))}
							</div>
						</li>
					))}
					{!results.length && (
						<li style={{textAlign:'center', opacity:.5, fontSize:'.7rem', padding:'2rem 0'}}>Sin resultados</li>
					)}
				</ul>
			</main>
		</div>
	);
};

const inputStyle: React.CSSProperties = {
	background:'#0d1c2a',
	border:'1px solid #1d3246',
	color:'#d8ecff',
	padding:'.55rem .7rem',
	borderRadius:'.65rem',
	font:'inherit',
	fontSize:'.7rem',
	outline:'none'
};

const cardStyle: React.CSSProperties = {
	border:'1px solid #1d3246',
	background:'linear-gradient(130deg,#102131,#0d1b29)',
	padding:'.85rem .95rem .9rem',
	borderRadius:'.9rem',
	boxShadow:'0 6px 24px -12px #000',
	position:'relative'
};

const tagStyle: React.CSSProperties = {
	fontSize:'.52rem',
	padding:'.25rem .5rem',
	background:'#173049',
	border:'1px solid #254861',
	color:'#8fb6ff',
	borderRadius:'.55rem',
	letterSpacing:'.5px',
	fontWeight:600
};

export default ClassicalPage;
