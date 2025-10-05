import React, { useEffect, useRef, useState } from 'react';
import { fetchChat } from '../services/ApiService';

type ChatMsg = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  ts: number;
  meta?: {
    action?: string;
    keywords?: string[];
    data?: string;
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
    padding:.55rem .7rem .6rem;
    border-radius:.85rem;
    font-size:.62rem;
    line-height:1.35;
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
    font-size:.62rem;
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
    font-size:.48rem;
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
  .cg-action {
    margin-top:.4rem;
    font-size:.5rem;
    font-weight:600;
    letter-spacing:.5px;
    color:#ffc2ec;
  }
  .cg-data {
    margin-top:.4rem;
    font-size:.5rem;
    padding:.45rem .55rem;
    background:#0f1e30;
    border:1px solid #253d53;
    border-radius:.55rem;
    white-space:pre-wrap;
    max-height:140px;
    overflow:auto;
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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstOpenRef = useRef(true);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    if (open && bodyRef.current) {
      requestAnimationFrame(() => {
        bodyRef.current!.scrollTop = bodyRef.current!.scrollHeight;
      });
    }
  }, [messages, open]);

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
        data: resp.data ? resp.data : undefined
      }
    };
    setMessages(m => [...m, botMsg]);
    setPending(false);
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(LS_KEY);
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
                {msg.meta?.data && (
                  <div className="cg-data">
                    {msg.meta.data.length > 650
                      ? msg.meta.data.slice(0, 650) + '...'
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
