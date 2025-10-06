import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchRemoteSearch,
  fetchPmcIdByTitle,
  fetchExternalMetadataByPmc
} from '../services/ApiService';

const injectClassicalStyles = () => {
  if (document.getElementById('classical-search-styles')) return;
  const st = document.createElement('style');
  st.id = 'classical-search-styles';
  st.textContent = `
  .c-wrap { max-width:1180px; margin:0 auto; padding:1.4rem 1.1rem 3.2rem; }
  .c-filters {
    display:flex; flex-wrap:wrap; gap:.65rem;
    background:linear-gradient(150deg,#0e1c2c,#0a1522);
    border:1px solid #1d3246; padding:.9rem 1rem 1rem;
    border-radius:1rem; margin-bottom:1.2rem;
    box-shadow:0 10px 38px -18px #000;
  }
  .cf-group { display:flex; flex-direction:column; gap:.3rem; min-width:140px; }
  .cf-group label { font-size:.55rem; letter-spacing:.65px; font-weight:600; text-transform:uppercase; color:#86a6c3; }
  .cf-group input, .cf-group select {
    background:#0d1c2a; border:1px solid #24405a; color:#d8ecff;
    padding:.45rem .55rem; border-radius:.55rem; font:.7rem/1 'inherit';
    outline:none; transition:border-color .25s, background .25s;
  }
  .cf-group input:focus, .cf-group select:focus {
    border-color:#43e9ff; background:#132a3c; box-shadow:0 0 0 2px #09131f,0 0 0 4px #43e9ff44;
  }
  .results-grid { display:flex; flex-direction:column; gap:.9rem; }
  .rs-card {
    position:relative; border:1px solid #1d3246;
    background:linear-gradient(125deg,#102131,#0d1b29);
    padding:1rem 1.05rem 1.1rem;
    border-radius:1rem;
    box-shadow:0 8px 30px -16px #000;
    display:flex; flex-direction:column; gap:.55rem;
    animation:fadeIn .45s ease;
  }
  .rs-title { font-size:.95rem; letter-spacing:.4px; margin:0; font-weight:600; color:#cfe6ff; }
  .rs-meta { display:flex; flex-wrap:wrap; gap:.45rem; }
  .rs-badge {
    background:#173049; border:1px solid #254861; color:#8fb6ff;
    font-size:.52rem; padding:.28rem .55rem; border-radius:.6rem; letter-spacing:.6px; font-weight:600;
  }
  .rs-badge.hl { background:linear-gradient(90deg,#43e9ff22,#ff3fb422); border-color:#2d536b; }
  .rs-abs { font-size:.63rem; line-height:1.45; color:#b8d2ea; margin:0; }
  .rs-actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.2rem; }
  .rs-btn {
    background:#182c3d; border:1px solid #27465e; color:#9fc5e7;
    font-size:.6rem; padding:.45rem .75rem; border-radius:.55rem;
    font-weight:600; letter-spacing:.5px; cursor:pointer;
    transition:background .25s, border-color .25s, color .25s;
  }
  .rs-btn:hover { background:#223d52; color:#d8ecff; border-color:#356281; }
  .rs-btn.primary {
    background:linear-gradient(90deg,#43e9ff,#ff3fb4); color:#09131d; border-color:#43e9ff;
  }
  .rs-btn.primary:hover { filter:brightness(1.08); }
  .rs-loading-line {
    height:4px; width:100%; border-radius:3px;
    background:linear-gradient(90deg,#102231,#163a53);
    overflow:hidden; position:relative; margin:.3rem 0 .1rem;
  }
  .rs-loading-line::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,#43e9ff,#ff3fb4,#b4ff4d);
    width:40%; animation:bar 1s linear infinite;
  }
  @keyframes bar { 0%{transform:translateX(-100%);} 100%{transform:translateX(250%);} }
  mark.search {
    background:#ff3fb422; color:#ffb9e5; padding:0 .15rem; border-radius:.25rem;
  }
  .empty {
    text-align:center; opacity:.5; font-size:.7rem; padding:2rem 0;
    border:1px dashed #1d3246; border-radius:.9rem;
  }
  .err-box {
    border:1px solid #5d2340; background:#31111f; color:#ffcdd8;
    font-size:.62rem; padding:.7rem .8rem; border-radius:.7rem; line-height:1.4;
  }
  `;
  document.head.appendChild(st);
};

type ComposedResult = {
  title: string;
  score: number;
  pmcId?: string | null;
  doi?: string | null;
  citationCount?: number;
  influentialCitationCount?: number;
  pdfUrl?: string | null;
  journal?: string | null;
  fieldsOfStudy?: string[];
  loadingMeta: boolean;
  error?: string;
};

const ClassicalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [rawResults, setRawResults] = useState<ComposedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [minScore, setMinScore] = useState(0);
  const [onlyDoi, setOnlyDoi] = useState(false);
  const [minCitations, setMinCitations] = useState(0);
  const [fieldFilter, setFieldFilter] = useState('');
  const [limit, setLimit] = useState(25);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    injectClassicalStyles();
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const qq = q.trim();
    setFetchError(null);
    setLoading(true);
    setRawResults([]);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const hits = await fetchRemoteSearch(qq, controller.signal);
      const base: ComposedResult[] = hits.slice(0, limit).map(h => ({
        title: h.title,
        score: h.score,
        loadingMeta: true
      }));
      setRawResults(base);

      const concurrency = 4;
      let idx = 0;
      const work = async () => {
        while (idx < base.length) {
          const current = idx++;
          const item = base[current];
          if (controller.signal.aborted) return;
          try {
            const pmc = await fetchPmcIdByTitle(item.title, controller.signal);
            let meta: { data?: { doi?: string; citationCount?: number; influentialCitationCount?: number; openAccessPdf?: { url?: string }; journal?: { name?: string }; fieldsOfStudy?: string[] } } | null = null;
            if (pmc) {
              meta = await fetchExternalMetadataByPmc(pmc, controller.signal);
            }
            setRawResults(r => r.map(rr => rr.title === item.title ? {
              ...rr,
              pmcId: pmc,
              doi: meta?.data?.doi || null,
              citationCount: meta?.data?.citationCount,
              influentialCitationCount: meta?.data?.influentialCitationCount,
              pdfUrl: meta?.data?.openAccessPdf?.url || null,
              journal: meta?.data?.journal?.name || null,
              fieldsOfStudy: meta?.data?.fieldsOfStudy,
              loadingMeta: false
            } : rr));
          } catch (e: any) {
            if (controller.signal.aborted) return;
            setRawResults(r => r.map(rr => rr.title === item.title ? {
              ...rr,
              loadingMeta: false,
              error: e?.message || 'Metadata error'
            } : rr));
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, base.length) }, () => work()));
    } catch (e: any) {
      if (!controller.signal.aborted) {
        setFetchError(e?.message || 'Search error');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const qParam = (searchParams.get('q') || '').trim();
    setQuery(qParam);
    if (qParam) {
      runSearch(qParam);
    } else {
      setRawResults([]);
    }
  }, [searchParams, runSearch]);

  const tokens = useMemo(
    () => query.split(/[\s,]+/).map(t => t.trim()).filter(t => t.length > 1),
    [query]
  );
  const highlight = (text: string) => {
    if (!tokens.length) return text;
    let html = text;
    tokens.forEach(t => {
      const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
      html = html.replace(r, '<mark class="search">$1</mark>');
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const filtered = useMemo(() => {
    return rawResults.filter(r => {
      if (r.score < minScore) return false;
      if (onlyDoi && !r.doi) return false;
      if (minCitations && (r.citationCount || 0) < minCitations) return false;
      if (fieldFilter && !r.fieldsOfStudy?.some(f =>
        f.toLowerCase().includes(fieldFilter.toLowerCase())
      )) return false;
      return true;
    });
  }, [rawResults, minScore, onlyDoi, minCitations, fieldFilter]);

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(160deg,#09131d,#0e1c2c)'}}>
      <main className="c-wrap">
        <h1 style={{margin:'0 0 .5rem', fontSize:'1.45rem', letterSpacing:'.5px'}}>Classical Search</h1>

        <div style={{margin:'0 0 1.1rem', fontSize:'.7rem', opacity:.75}}>
          Query:&nbsp;
          <code style={{
            background:'#102131',
            border:'1px solid #1d3246',
            padding:'.25rem .45rem',
            borderRadius:'.5rem',
            fontSize:'.65rem',
            color:'#a6c9e9'
          }}>
            {query || '(empty)'}
          </code>
          {loading && <span style={{marginLeft:'.6rem', color:'#43e9ff'}}>loading…</span>}
        </div>

        <section className="c-filters">
          <div className="cf-group">
            <label>Min Score</label>
            <input type="number" value={minScore} onChange={e => setMinScore(Number(e.target.value) || 0)} />
          </div>
            <div className="cf-group">
            <label>Only DOI</label>
            <select value={String(onlyDoi)} onChange={e => setOnlyDoi(e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div className="cf-group">
            <label>Min Citations</label>
            <input type="number" value={minCitations} onChange={e => setMinCitations(Number(e.target.value) || 0)} />
          </div>
          <div className="cf-group" style={{flexGrow:1}}>
            <label>Field Filter</label>
            <input value={fieldFilter} onChange={e => setFieldFilter(e.target.value)} placeholder="Medicine..." />
          </div>
          <div className="cf-group">
            <label>Limit</label>
            <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value) || 10)} />
          </div>
          <div style={{display:'flex', alignItems:'flex-end', gap:'.5rem'}}>
            <button
              type="button"
              onClick={() => {
                setMinScore(0);
                setOnlyDoi(false);
                setMinCitations(0);
                setFieldFilter('');
              }}
              style={{...inputStyle, cursor:'pointer', padding:'.55rem .9rem', fontSize:'.62rem'}}
            >Reset Filters</button>
          </div>
        </section>

        {fetchError && <div className="err-box">{fetchError}</div>}

        {loading && (
          <div style={{margin:'1.2rem 0 .6rem'}}>
            <div className="rs-loading-line" />
            <div style={{fontSize:'.6rem', opacity:.6}}>Loading results...</div>
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="empty">
            {query ? 'No matches with current filters.' : 'Type a query to start.'}
          </div>
        )}

        <div className="results-grid">
          {filtered.map(r => (
            <article key={r.title} className="rs-card">
              <h2 className="rs-title">{highlight(r.title)}</h2>
              <div className="rs-meta">
                <span className="rs-badge hl">Score {r.score.toFixed(2)}</span>
                {r.pmcId && <span className="rs-badge">PMC {r.pmcId}</span>}
                {r.doi && <span className="rs-badge">DOI {r.doi}</span>}
                {typeof r.citationCount === 'number' && <span className="rs-badge">Citations {r.citationCount}</span>}
                {typeof r.influentialCitationCount === 'number' && <span className="rs-badge">Influential {r.influentialCitationCount}</span>}
                {r.journal && <span className="rs-badge">{r.journal}</span>}
                {r.fieldsOfStudy?.slice(0,3).map(f => <span key={f} className="rs-badge">{f}</span>)}
                {r.loadingMeta && <span className="rs-badge">Loading meta...</span>}
                {r.error && (
                  <span
                    className="rs-badge"
                    style={{ background:'#40202d', borderColor:'#5a2f3f', color:'#ffc9d7' }}
                  >
                    Meta error
                  </span>
                )}
              </div>

              {r.pdfUrl && (
                <p className="rs-abs" style={{opacity:.75, fontSize:'.55rem', marginTop:'-.25rem'}}>
                  PDF: <a
                    href={r.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{color:'#8fb6ff'}}
                  >{r.pdfUrl}</a>
                </p>
              )}

              {!r.pdfUrl && !r.loadingMeta && (
                <p className="rs-abs" style={{opacity:.45, fontSize:'.55rem', marginTop:'-.2rem'}}>
                  No PDF link detected.
                </p>
              )}

              <div className="rs-actions">
                <button
                  className="rs-btn primary"
                  disabled={!r.pmcId}
                  onClick={() => {
                    if (!r.pmcId) return;
                    window.location.href = `/paper/${encodeURIComponent(r.pmcId)}`;
                  }}
                >
                  Open in App
                </button>
                <button
                  className="rs-btn"
                  disabled={!r.doi}
                  onClick={() => {
                    if (r.doi) window.open(`https://doi.org/${r.doi}`, '_blank');
                  }}
                >
                  Open DOI
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

const inputStyle = {
  background:'#0d1c2a',
  border:'1px solid #24405a',
  color:'#d8ecff',
  padding:'.45rem .55rem',
  borderRadius:'.55rem',
  font:'.7rem/1 inherit',
  outline:'none',
  transition:'border-color .25s, background .25s',
};

export default ClassicalPage;
