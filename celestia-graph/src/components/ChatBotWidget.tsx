import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchChat } from '../services/ApiService';

type ChatMsg = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  ts: number;
  meta?: {
    action?: string;
    keywords?: string[];
    data?: any; // ahora puede ser objeto o string
  };
};

const LS_KEY = 'cg_chat_history_v1';

const injectStyles = () => {
  if (document.getElementById('cg-chat-styles')) return;
  const s = document.createElement('style');
  s.id = 'cg-chat-styles';
  s.textContent = `
  .cg-chat-fab {
    position:fixed;
    bottom:22px;
    right:22px;
    width:86px;
    height:86px;
    border-radius:50%;
    background:radial-gradient(circle at 30% 30%,#223654,#0c1724) padding-box,
               linear-gradient(140deg,#43e9ff,#ff3fb4,#ffb347) border-box;
    border:2px solid transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    box-shadow:0 10px 34px -10px #000,0 0 0 1px #ffffff18;
    z-index:600;
    overflow:hidden;
    transition:transform .25s, box-shadow .25s;
    padding:6px;
  }
  .cg-chat-fab:hover {
    transform:translateY(-4px) scale(1.04);
    box-shadow:0 14px 40px -12px #000,0 0 0 1px #43e9ff66;
  }
  .cg-chat-fab img {
    width:64%;
    height:64%;
    border-radius:50%;
    background:radial-gradient(circle at 50% 42%, #294363 0%, #132332 70%);
    padding:6px;
    box-sizing:border-box;
    object-fit:contain;
    filter:drop-shadow(0 0 6px #43e9ff66);
    pointer-events:none;
    transition:transform .45s cubic-bezier(.4,.2,.2,1), filter .35s;
  }
  .cg-chat-fab:hover img {
    transform:rotate(8deg) scale(1.04);
    filter:drop-shadow(0 0 10px #43e9ffaa);
  }
  .cg-badge-new {
    position:absolute;
    top:-4px;
    right:-4px;
    width:18px;
    height:18px;
    background:linear-gradient(90deg,#ff3fb4,#ffb347);
    color:#09131d;
    font-size:.55rem;
    font-weight:700;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:50%;
    box-shadow:0 0 0 2px #0d1724, 0 0 12px -2px #ff5ec5;
    animation:pulseNew 2.2s ease-in-out infinite;
  }
  @keyframes pulseNew {
    0%,100% { transform:scale(1); opacity:1;}
    50% { transform:scale(1.25); opacity:.45;}
  }
  .cg-chat-panel {
    position:fixed;
    bottom:118px;
    right:26px;
    width:340px;
    max-height:520px;
    background:linear-gradient(165deg,#0f1e30,#0a1421);
    border:1px solid #1f3952;
    border-radius:1.1rem;
    box-shadow:0 14px 48px -16px #000,0 0 0 1px #ffffff08;
    display:flex;
    flex-direction:column;
    overflow:hidden;
    z-index:610;
    animation:cgSlideUp .35s cubic-bezier(.4,.2,.2,1);
  }
  @keyframes cgSlideUp {
    from {opacity:0; transform:translateY(18px) scale(.96);}
    to {opacity:1; transform:none;}
  }
  .cg-chat-head {
    padding:.75rem .95rem;
    display:flex;
    align-items:center;
    justify-content:space-between;
    background:linear-gradient(90deg,#13283b,#102132);
    border-bottom:1px solid #1d3348;
  }
  .cg-chat-head h4 {
    margin:0;
    font-size:.72rem;
    letter-spacing:.9px;
    text-transform:uppercase;
    font-weight:700;
    background:linear-gradient(90deg,#43e9ff,#ff3fb4 70%,#ffb347);
    -webkit-background-clip:text;
    color:transparent;
  }
  .cg-chat-head button {
    background:#182a3c;
    color:#8fb6ff;
    border:1px solid #28425a;
    font-size:.55rem;
    letter-spacing:.5px;
    padding:.35rem .55rem;
    border-radius:.55rem;
    cursor:pointer;
    font-weight:600;
    transition:background .25s,color .25s;
  }
  .cg-chat-head button:hover {
    background:#20364c;
    color:#d8ecff;
  }
  .cg-chat-body {
    flex:1;
    overflow-y:auto;
    padding:.75rem .85rem 1rem;
    display:flex;
    flex-direction:column;
    gap:.55rem;
    scrollbar-width:thin;
    scrollbar-color:#284660 #0f1e30;
  }
  .cg-chat-body::-webkit-scrollbar { width:8px; }
  .cg-chat-body::-webkit-scrollbar-track { background:#0f1e30; }
  .cg-chat-body::-webkit-scrollbar-thumb { background:#284660; border-radius:4px; }
  .cg-msg {
    max-width:80%;
    padding:.65rem .8rem .7rem;
    border-radius:.9rem;
    font-size:.7rem; /* aumentado */
    line-height:1.4;
    letter-spacing:.4px;
    position:relative;
    word-break:break-word;
    animation:cgMsg .3s ease;
  }
  @keyframes cgMsg {
    from {opacity:0; transform:translateY(6px);}
    to {opacity:1; transform:none;}
  }
  .cg-msg.user {
    margin-left:auto;
    background:linear-gradient(130deg,#1e3550,#264869);
    border:1px solid #2d5d80;
    color:#d8ecff;
  }
  .cg-msg.bot {
    background:#142839;
    border:1px solid #234058;
    color:#c7dbf1;
  }
  .cg-time {
    display:block;
    opacity:.4;
    font-size:.5rem;
    margin-top:.3rem;
  }
  .cg-chat-input {
    border-top:1px solid #1d3348;
    background:linear-gradient(90deg,#0f1e30,#0d1c2a);
    padding:.6rem .65rem .65rem;
    display:flex;
    gap:.5rem;
  }
  .cg-chat-input form {
    display:flex;
    gap:.5rem;
    flex:1;
  }
  .cg-chat-input input {
    flex:1;
    background:#0d1724;
    border:1px solid #223a52;
    color:#cfe3ff;
    font:inherit;
    padding:.55rem .65rem;
    border-radius:.6rem;
    font-size:.68rem;
    letter-spacing:.4px;
    outline:none;
    transition:border-color .25s, background .25s, box-shadow .25s;
  }
  .cg-chat-input input:focus {
    border-color:#43e9ff;
    background:#132636;
    box-shadow:0 0 0 2px #0a141e,0 0 0 4px #43e9ff44;
  }
  .cg-send-btn {
    background:linear-gradient(110deg,#43e9ff,#ff3fb4);
    border:1px solid #43e9ff;
    color:#09131d;
    font-size:.6rem;
    font-weight:700;
    letter-spacing:.6px;
    padding:.55rem .75rem;
    border-radius:.65rem;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:.35rem;
    box-shadow:0 4px 18px -8px #000;
    transition:filter .25s;
  }
  .cg-send-btn:hover:not(:disabled) { filter:brightness(1.08); }
  .cg-send-btn:disabled { opacity:.5; cursor:default; }
  .cg-empty {
    opacity:.45;
    font-size:.58rem;
    text-align:center;
    margin-top:1.4rem;
  }
  .cg-keywords {
    margin-top:.45rem;
    display:flex;
    flex-wrap:wrap;
    gap:.35rem;
  }
  .cg-chip {
    background:linear-gradient(120deg,#1e3550,#264869);
    border:1px solid #2d5d80;
    padding:.3rem .5rem;
    font-size:.54rem;
    border-radius:.65rem;
    letter-spacing:.4px;
    color:#d0ecff;
    position:relative;
  }
  .cg-chip:before {
    content:'#';
    opacity:.55;
    margin-right:2px;
  }
  .cg-chip.score {
    background:#233c55;
    border-color:#355e82;
  }
  .cg-action {
    margin-top:.4rem;
    font-size:.56rem;
    font-weight:600;
    letter-spacing:.5px;
    color:#ffc2ec;
  }
  .cg-data, .cg-data-block {
    margin-top:.5rem;
    font-size:.58rem;
    line-height:1.35;
  }
  .cg-data-block {
    background:#0f1e30;
    border:1px solid #253d53;
    padding:.6rem .65rem .65rem;
    border-radius:.7rem;
  }
  .cg-subtitle {
    font-weight:600;
    font-size:.6rem;
    margin:0 0 .4rem;
    letter-spacing:.5px;
    color:#8fd6ff;
  }
  .cg-articles {
    display:flex;
    flex-direction:column;
    gap:.55rem;
    margin-top:.4rem;
  }
  .cg-article {
    background:linear-gradient(125deg,#13283b,#102232);
    border:1px solid #1f3a53;
    padding:.55rem .6rem .55rem;
    border-radius:.6rem;
  }
  .cg-article-title {
    font-size:.58rem;
    font-weight:600;
    margin:0 0 .25rem;
    color:#d8ecff;
  }
  .cg-article-meta {
    font-size:.48rem;
    opacity:.65;
    display:flex;
    gap:.6rem;
    flex-wrap:wrap;
    letter-spacing:.4px;
  }
  @media (max-width:520px) {
    .cg-chat-fab {
      width:74px;
      height:74px;
      bottom:16px;
      right:16px;
    }
    .cg-chat-fab img { width:70%; height:70%; }
    .cg-chat-panel {
      right:10px;
      left:10px;
      bottom:108px;
      width:auto;
      max-height:60vh;
    }
  }
  `;
  document.head.appendChild(s);
};

const ChatBotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [clusterNames, setClusterNames] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstOpenRef = useRef(true);

  useEffect(() => { injectStyles(); }, []);

  // Cargar nombres de clusters desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('combinedGroupsV1');
      if (stored) {
        const groups = JSON.parse(stored);
        const names: string[] = [];
        const used = new Set<string>();
        
        groups.slice(0, 52).forEach((g: any, idx: number) => {
          const labels = g.labels || [];
          const base = labels
            .filter((w: any) => typeof w === 'string')
            .map((w: string) => w.trim())
            .filter((w: string) => /^[A-Za-z]{4,}$/.test(w));
          const unique = Array.from(new Set(base.map((w: string) => w.toLowerCase())));
          const tokens: string[] = [];
          
          if (unique.length >= 3) {
            const pool = [...unique];
            for (let i = 0; i < 3; i++) {
              const r = Math.floor(Math.random() * pool.length);
              tokens.push(pool.splice(r, 1)[0]);
            }
          } else if (unique.length > 0) {
            tokens.push(...unique);
          }
          
          while (tokens.length < 3) {
            tokens.push(`theme${idx}`);
          }
          
          const formatted = tokens.slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1));
          let name = formatted.join(', ');
          
          if (used.has(name)) {
            let c = 2;
            while (used.has(`${name} (${c})`)) c++;
            name = `${name} (${c})`;
          }
          used.add(name);
          names.push(name);
        });
        
        setClusterNames(names);
      }
    } catch (e) {
      console.warn('[ChatBot] Error loading cluster names:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    if (open && bodyRef.current) {
      requestAnimationFrame(() => {
        bodyRef.current!.scrollTop = bodyRef.current!.scrollHeight;
      });
    }
  }, [messages, open]);

  // Navegación automática cuando hay recomendaciones
  useEffect(() => {
    if (pendingNavigation) {
      // Navegar a GraphPage con el cluster ID en la URL
      navigate(`/graph?cluster=${encodeURIComponent(pendingNavigation)}`);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || pending) return;
    const userMsg: ChatMsg = { id:'u-'+Date.now(), role:'user', text:input.trim(), ts:Date.now() };
    setMessages(m => [...m, userMsg]);
    const userText = input.trim();
    setInput('');
    setPending(true);

    const resp = await fetchChat(userText, 'default');
    const botMsg: ChatMsg = {
      id:'b-'+Date.now(),
      role:'bot',
      text: resp.message || '(sin mensaje)',
      ts: Date.now(),
      meta: {
        action: resp.action || undefined,
        keywords: resp.keywords && resp.keywords.length ? resp.keywords : undefined,
        data: resp.data ?? undefined
      }
    };
    setMessages(m => [...m, botMsg]);
    setPending(false);

    // Si hay recomendaciones, tomar el primer cluster
    if (resp.action === 'recommendations' && resp.data?.recommended_clusters?.length > 0) {
      const firstCluster = resp.data.recommended_clusters[0];
      if (firstCluster.cluster_id) {
        // Pequeño delay para que el usuario vea el mensaje antes de navegar
        setTimeout(() => {
          setPendingNavigation(firstCluster.cluster_id);
        }, 1500);
      }
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(LS_KEY);
  };

  const handleClusterClick = (clusterId: string) => {
    // Marcar como seleccionado y navegar inmediatamente
    setSelectedCluster(clusterId);
    navigate(`/graph?cluster=${encodeURIComponent(clusterId)}`);
  };

  const toggle = () => {
    setOpen(o => !o);
    if (firstOpenRef.current) {
      firstOpenRef.current = false;
      if (messages.length === 0) {
        setTimeout(() => {
          setMessages(m => [...m, {
            id:'b-welcome',
            role:'bot',
            text:'¡Hola! Soy el bot demo de CelestiaGraph. Todo es simulado.',
            ts: Date.now()
          }]);
        }, 300);
      }
    }
  };

  return (
    <>
      <button aria-label="Abrir chat" className="cg-chat-fab" onClick={toggle}>
        <img src="/img/chatBot.png" alt="ChatBot" />
        {!open && messages.length === 0 && <span className="cg-badge-new">!</span>}
      </button>
      {open && (
        <section className="cg-chat-panel" role="dialog" aria-label="Chat Bot Demo">
          <div className="cg-chat-head">
            <h4>Chat Bot</h4>
            <div style={{display:'flex', gap:'.4rem'}}>
              <button onClick={clear} title="Limpiar">Limpiar</button>
              <button onClick={toggle} title="Cerrar">Cerrar</button>
            </div>
          </div>
          <div className="cg-chat-body" ref={bodyRef}>
            {messages.length === 0 && <div className="cg-empty">No hay mensajes.</div>}
            {messages.map(msg => (
              <div key={msg.id} className={`cg-msg ${msg.role}`}>
                <div>{msg.text}</div>
                {msg.meta?.action && (
                  <div className="cg-action">Acción: {msg.meta.action}</div>
                )}
                {msg.meta?.keywords && (
                  <div className="cg-keywords">
                    {msg.meta.keywords.map(k => <span key={k} className="cg-chip">{k}</span>)}
                  </div>
                )}
                {/* NUEVO: data estructurada */}
                {msg.meta?.data && typeof msg.meta.data === 'object' && !Array.isArray(msg.meta.data) && (
                  <div className="cg-data-block">
                    {Array.isArray(msg.meta.data.keywords) && msg.meta.data.keywords.length > 0 && (
                      <>
                        <h5 className="cg-subtitle">Detected Keywords</h5>
                        <div className="cg-keywords">
                          {msg.meta.data.keywords.map((k: string) => (
                            <span key={k} className="cg-chip">{k}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {Array.isArray(msg.meta.data.articles) && msg.meta.data.articles.length > 0 && (
                      <>
                        <h5 className="cg-subtitle" style={{marginTop:'.75rem'}}>Suggested Articles</h5>
                        <div className="cg-articles">
                          {msg.meta.data.articles.slice(0, 8).map((a: any, i: number) => (
                            <div key={a.pmc_id || i} className="cg-article">
                              <p className="cg-article-title">{a.title || '(sin título)'}</p>
                              <div className="cg-article-meta">
                                {a.pmc_id && <span>ID: {a.pmc_id}</span>}
                                {a.cluster_id && <span>Cluster: {a.cluster_id}</span>}
                                {typeof a.relevance_score === 'number' && (
                                  <span>Score: {a.relevance_score.toFixed(3)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {/* Mostrar clusters recomendados */}
                    {Array.isArray(msg.meta.data.recommended_clusters) && msg.meta.data.recommended_clusters.length > 0 && (
                      <>
                        <h5 className="cg-subtitle" style={{marginTop:'.75rem'}}>🎯 Recommended Clusters</h5>
                        <div className="cg-articles">
                          {msg.meta.data.recommended_clusters.slice(0, 5).map((cluster: any, i: number) => {
                            const isSelected = selectedCluster === cluster.cluster_id || (selectedCluster === null && i === 0);
                            return (
                              <button
                                key={cluster.cluster_id || i}
                                onClick={() => handleClusterClick(cluster.cluster_id)}
                                className="cg-article"
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  border: isSelected ? '1px solid #43e9ff' : '1px solid #1f3a53',
                                  background: isSelected ? 'linear-gradient(125deg,#1a3a50,#152838)' : 'linear-gradient(125deg,#13283b,#102232)',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '.55rem .6rem .55rem',
                                  borderRadius: '.6rem'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(125deg,#1a3a50,#152838)';
                                  e.currentTarget.style.borderColor = '#43e9ff';
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseOut={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = 'linear-gradient(125deg,#13283b,#102232)';
                                    e.currentTarget.style.borderColor = '#1f3a53';
                                  } else {
                                    e.currentTarget.style.background = 'linear-gradient(125deg,#1a3a50,#152838)';
                                  }
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                <p className="cg-article-title" style={{display:'flex', alignItems:'center', gap:'.4rem', justifyContent:'space-between'}}>
                                  <span style={{display:'flex', flexDirection:'column', gap:'.2rem'}}>
                                    <span style={{fontSize:'.62rem', fontWeight:600}}>
                                      {clusterNames[parseInt(cluster.cluster_id)] || `Cluster #${cluster.cluster_id}`}
                                    </span>
                                    <span style={{fontSize:'.5rem', opacity:.6, fontWeight:400}}>ID: {cluster.cluster_id}</span>
                                  </span>
                                  {isSelected && <span style={{fontSize:'.5rem', background:'#43e9ff', color:'#0a1421', padding:'.15rem .35rem', borderRadius:'.35rem', fontWeight:700}}>SELECTED</span>}
                                </p>
                                <div className="cg-article-meta">
                                  {typeof cluster.relevance_score === 'number' && (
                                    <span>Relevance: {(cluster.relevance_score * 100).toFixed(1)}%</span>
                                  )}
                                  {Array.isArray(cluster.matched_keywords) && cluster.matched_keywords.length > 0 && (
                                    <span>Keywords: {cluster.matched_keywords.join(', ')}</span>
                                  )}
                                  {cluster.total_keywords_in_cluster && (
                                    <span>Total: {cluster.total_keywords_in_cluster}</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div style={{marginTop:'.6rem', fontSize:'.58rem', color:'#43e9ff', fontWeight:600, letterSpacing:'.4px', display:'flex', alignItems:'center', gap:'.4rem'}}>
                          <span style={{fontSize:'.75rem'}}>🚀</span>
                          Auto-navigating to Cluster #{selectedCluster || msg.meta.data.recommended_clusters[0].cluster_id} • Click to change
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* fallback si data es string */}
                {msg.meta?.data && typeof msg.meta.data === 'string' && (
                  <div className="cg-data">
                    {msg.meta.data.length > 800
                      ? msg.meta.data.slice(0, 800) + '...'
                      : msg.meta.data}
                  </div>
                )}
                <span className="cg-time">{new Date(msg.ts).toLocaleTimeString()}</span>
              </div>
            ))}
            {pending && (
              <div className="cg-msg bot">
                Escribiendo...
                <span className="cg-time">{new Date().toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          <div className="cg-chat-input">
            <form onSubmit={send}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                aria-label="Mensaje"
              />
              <button type="submit" className="cg-send-btn" disabled={pending || !input.trim()}>
                Enviar
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default ChatBotWidget;