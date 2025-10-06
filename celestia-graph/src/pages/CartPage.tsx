import React from 'react';
import { useCart } from '../context/CartContext';
import { jsPDF } from 'jspdf';
import { Link, useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { items, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const truncateAuthors = (raw: string) => {
    if (!raw || raw === 'Unknown') return raw || 'Unknown';
    const parts = raw.split(/\s*,\s*/).filter(Boolean);
    if (parts.length <= 3) return parts.join(', ');
    return parts.slice(0, 3).join(', ') + ' …';
  };

  const pdfCols = [
    { key:'id', label:'ID', w:55 },
    { key:'name', label:'Name', w:150 },
    { key:'date', label:'Date', w:65 },
    { key:'keywords', label:'Keywords', w:140 },
    { key:'authors', label:'Authors', w:120 },
    { key:'abstract', label:'Abstract', w:370 },
    { key:'link', label:'Link', w:140 }
  ];

  const exportPDF = () => {
    const doc = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 36;
    let y = 46;

    // PAGE BACKGROUND BLACK
    doc.setFillColor(0,0,0);
    doc.rect(0, 0, pageW, pageH, 'F');

    // SCALE columns to fit available width
    const availableWidth = pageW - marginX * 2;
    const totalWidth = pdfCols.reduce((s,c)=>s + c.w, 0);
    const scale = totalWidth > availableWidth ? (availableWidth / totalWidth) : 1;
    const cols = pdfCols.map(c => ({ ...c, w: c.w * scale }));

    doc.setFontSize(14);
    doc.setTextColor(255,255,255);
    doc.text('CelestiaGraph - Article List', marginX, y);
    y += 16;
    doc.setFontSize(9);
    doc.text(`Total: ${items.length}`, marginX, y);
    y += 12;

    // HEADER (each column cell black)
    doc.setFontSize(8);
    let x = marginX;
    const headerH = 16;
    cols.forEach(c => {
      doc.setFillColor(0,0,0);
      doc.rect(x, y, c.w, headerH, 'F');
      doc.setTextColor(255,255,255);
      doc.text(c.label, x + 4, y + 11);
      x += c.w;
    });
    y += headerH;

    // BODY
    const bodyFontSize = 6;
    doc.setFontSize(bodyFontSize);
    const lineGap = 8;
    const rowPaddingY = 3;

    const wrapText = (text: string, maxWidth: number) => {
      const words = (text || '').split(/\s+/);
      const lines: string[] = [];
      let line = '';
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (doc.getTextWidth(test) > maxWidth - 6) {
          if (line) lines.push(line);
          line = w;
        } else line = test;
      });
      if (line) lines.push(line);
      return lines.slice(0, 10);
    };

    items.forEach(item => {
      const heights: number[] = [];
      const prepared: Record<string,string[]> = {};
      cols.forEach(c => {
        let valRaw = (item as any)[c.key] ?? '';
        if (c.key === 'authors') valRaw = truncateAuthors(String(valRaw));
        const val = Array.isArray(valRaw) ? valRaw.join(', ') : String(valRaw);
        prepared[c.key] = wrapText(val, c.w);
        heights.push(prepared[c.key].length);
      });
      const linesCount = Math.max(...heights);
      const rowH = linesCount * lineGap + rowPaddingY * 2;

      if (y + rowH > pageH - 40) {
        doc.addPage();
        // repaint new page background
        doc.setFillColor(0,0,0);
        doc.rect(0, 0, pageW, pageH, 'F');
        y = 40;
        // redraw header
        doc.setFontSize(8);
        let hx = marginX;
        cols.forEach(c => {
          doc.setFillColor(0,0,0);
            doc.rect(hx, y, c.w, headerH, 'F');
            doc.setTextColor(255,255,255);
            doc.text(c.label, hx + 4, y + 11);
          hx += c.w;
        });
        y += headerH;
        doc.setFontSize(bodyFontSize);
      }

      // Per-column black backgrounds
      let bgX = marginX;
      cols.forEach(c => {
        doc.setFillColor(0,0,0);
        doc.rect(bgX, y, c.w, rowH, 'F');
        bgX += c.w;
      });

      // Text
      doc.setTextColor(235,235,235);
      let cx = marginX;
      cols.forEach(c => {
        const lines = prepared[c.key];
        lines.forEach((ln, idx) => {
          doc.text(ln, cx + 4, y + rowPaddingY + 8 + idx * lineGap);
        });
        cx += c.w;
      });

      // Grid (subtle)
      doc.setDrawColor(50,50,50);
      let sepX = marginX;
      cols.forEach(c => {
        doc.line(sepX, y, sepX, y + rowH);
        sepX += c.w;
      });
      doc.line(marginX, y + rowH, marginX + cols.reduce((s,c)=>s+c.w,0), y + rowH);
      y += rowH;
    });

    doc.save('celestia_graph_articles.pdf');
  };

  const exportCSV = () => {
    const header = ['id','name','date','keywords','authors','abstract','link'];
    const rows = items.map(i => header
      .map(h => {
        let v = (i as any)[h] ?? '';
        if (h === 'authors') v = truncateAuthors(String(v));
        return `"${String(v).replace(/"/g,'""')}"`;
      })
      .join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'celestia_graph_articles.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      padding:'1.1rem clamp(1rem,2.5vw,2.4rem)',
      color:'#cfe3ff',
      minHeight:'100vh',
      background:'radial-gradient(circle at 30% 20%,#122235,#08121d 65%)',
      fontSize:'.8rem'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:'.8rem', flexWrap:'wrap'}}>
        <h2 style={{
          margin:'0 0 .4rem',
          fontSize:'1.05rem',
          letterSpacing:'.6px',
          background:'linear-gradient(90deg,#43e9ff,#ff3fb4 70%,#ffb347)',
          WebkitBackgroundClip:'text',
          color:'transparent'
        }}>Cart / List</h2>
        <Link to="/" style={{textDecoration:'none', fontSize:'.65rem', padding:'.4rem .65rem', border:'1px solid #25405a', borderRadius:'.6rem', background:'#0d1c2b', color:'#8fb6ff'}}>Home</Link>
        <button
          onClick={()=>navigate(-1)}
          style={{
            textDecoration:'none',
            fontSize:'.65rem',
            padding:'.4rem .65rem',
            border:'1px solid #25405a',
            borderRadius:'.6rem',
            background:'#0d1c2b',
            color:'#8fb6ff',
            cursor:'pointer'
          }}
        >
          Back
        </button>
      </div>

      <div style={{display:'flex', gap:'.6rem', flexWrap:'wrap', margin:'0 0 1rem'}}>
        <button onClick={exportPDF} className="exp-btn" style={btnStyle('#43e9ff','#102132')}>PDF</button>
        <button onClick={exportCSV} className="exp-btn" style={btnStyle('#ffb347','#20140a')}>CSV</button>
        <button onClick={clear} disabled={!items.length} style={{...btnStyle('#ff3f5e','#2a0d14'), opacity: items.length?1:.4}}>Clear</button>
      </div>

      <div style={{
        overflowX:'auto',
        border:'1px solid #1d3750',
        borderRadius:'.9rem',
        background:'linear-gradient(145deg,#0e1c2b,#0a141f)',
        boxShadow:'0 10px 28px -14px #000, 0 0 0 1px #ffffff08'
      }}>
        <table style={{width:'100%', borderCollapse:'collapse', minWidth:'920px'}}>
          <thead>
            <tr style={{background:'#132739'}}>
              {['ID','Name','Date','Keywords','Authors','Abstract','Link','Action'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} style={{padding:'1.4rem', textAlign:'center', fontSize:'.75rem', opacity:.6}}>
                  No items yet. Go to the graph and add with “Add to list...”.
                </td>
              </tr>
            )}
            {items.map(it => {
              const truncatedAuthors = truncateAuthors(it.authors);
              return (
                <tr key={it.id} style={{borderTop:'1px solid #1a3146'}}>
                  <td style={tdStyle}>{it.id}</td>
                  <td style={tdStyle}>{it.name}</td>
                  <td style={tdStyle}>{it.date}</td>
                  <td style={tdStyle}>{it.keywords}</td>
                  <td style={tdStyle}>{truncatedAuthors}</td>
                  <td
                    style={{
                      ...tdStyle,
                      minWidth:'380px',
                      maxWidth:'560px',
                      lineHeight:1.25
                    }}
                  >
                    <span style={{display:'inline-block', whiteSpace:'normal'}}>
                      {it.abstract}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {it.link === '#' ? '-' : (
                      <a href={it.link} target="_blank" rel="noreferrer" style={{color:'#4ad4ff'}}>
                        link
                      </a>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => removeItem(it.id)}
                      style={{
                        background:'linear-gradient(120deg,#281017,#441f2a)',
                        border:'1px solid #552835',
                        color:'#ff90aa',
                        fontSize:'.6rem',
                        padding:'.35rem .55rem',
                        borderRadius:'.55rem',
                        cursor:'pointer'
                      }}
                    >Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{fontSize:'.6rem', opacity:.55, marginTop:'1rem', lineHeight:1.4}}>
        Export as PDF or CSV. PDF generates a structured table; CSV can be imported into Google Sheets.
      </p>
    </div>
  );
};

const btnStyle = (gradColor: string, textColor: string): React.CSSProperties => ({
  background:`linear-gradient(120deg,${gradColor},${gradColor}55)`,
  color:textColor,
  border:'1px solid #2f4f66',
  fontSize:'.65rem',
  fontWeight:600,
  letterSpacing:'.6px',
  padding:'.55rem .85rem',
  borderRadius:'.8rem',
  cursor:'pointer',
  display:'inline-flex',
  alignItems:'center',
  gap:'.4rem',
  boxShadow:'0 4px 18px -8px #000'
});

const thStyle: React.CSSProperties = {
  textAlign:'left',
  padding:'.65rem .7rem',
  fontSize:'.6rem',
  letterSpacing:'.8px',
  textTransform:'uppercase',
  color:'#8fb6ff',
  fontWeight:600
};

const tdStyle: React.CSSProperties = {
  padding:'.6rem .7rem',
  fontSize:'.68rem',
  letterSpacing:'.3px',
  verticalAlign:'middle'
};

export default CartPage;
