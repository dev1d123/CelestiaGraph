import React, { useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { items, removeItem, clear } = useCart();

  const pdfCols = [
    { key:'id', label:'ID', w:40 },
    { key:'name', label:'Nombre', w:120 },
    { key:'date', label:'Fecha', w:55 },
    { key:'keywords', label:'Keywords', w:90 },
    { key:'authors', label:'Autores', w:90 },
    { key:'abstract', label:'Abstract', w:180 },
    { key:'link', label:'Enlace', w:110 }
  ];

  const exportPDF = () => {
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 36;
    let y = 46;

    doc.setFontSize(16);
    doc.text('CelestiaGraph - Lista de Artículos', marginX, y);
    y += 18;
    doc.setFontSize(10);
    doc.text(`Total: ${items.length}`, marginX, y);
    y += 14;

    doc.setFontSize(9);
    doc.setFillColor(26,52,78);
    doc.setTextColor(255);
    let x = marginX;
    const headerH = 18;
    pdfCols.forEach(c => {
      doc.rect(x, y, c.w, headerH, 'F');
      doc.text(c.label, x + 4, y + 12);
      x += c.w;
    });
    y += headerH;

    const bodyFontSize = 8;
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(30,30,34);

    const lineGap = 10;
    const rowPaddingY = 4;

    const wrapText = (text: string, maxWidth: number) => {
      const words = (text || '').split(/\s+/);
      const lines: string[] = [];
      let line = '';
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (doc.getTextWidth(test) > maxWidth - 6) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);
      return lines.slice(0, 5);
    };

    items.forEach(item => {
      const heights: number[] = [];
      const prepared: Record<string,string[]> = {};
      pdfCols.forEach(c => {
        const valRaw = (item as any)[c.key] ?? '';
        const val = Array.isArray(valRaw) ? valRaw.join(', ') : String(valRaw);
        if (c.key === 'link') {
          prepared[c.key] = wrapText(val, c.w);
        } else {
          prepared[c.key] = wrapText(val, c.w);
        }
        heights.push(prepared[c.key].length);
      });
      const linesCount = Math.max(...heights);
      const rowH = linesCount * lineGap + rowPaddingY * 2;

      if (y + rowH > pageH - 40) {
        doc.addPage();
        y = 40;
        doc.setFillColor(26,52,78);
        doc.setTextColor(255);
        let hx = marginX;
        doc.setFontSize(9);
        pdfCols.forEach(c => {
          doc.rect(hx, y, c.w, headerH, 'F');
            doc.text(c.label, hx + 4, y + 12);
          hx += c.w;
        });
        y += headerH;
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(30,30,34);
      }

      doc.setFillColor(240,245,250);
      doc.rect(marginX, y, pdfCols.reduce((s,c)=>s+c.w,0), rowH, 'F');

      let cx = marginX;
      pdfCols.forEach(c => {
        const lines = prepared[c.key];
        lines.forEach((ln, idx) => {
          doc.text(ln, cx + 4, y + rowPaddingY + 10 + idx * lineGap);
        });
        cx += c.w;
      });

      doc.setDrawColor(200,215,228);
      doc.line(marginX, y + rowH, marginX + pdfCols.reduce((s,c)=>s+c.w,0), y + rowH);
      y += rowH;
    });

    doc.save('celestia_graph_articulos.pdf');
  };

  const exportCSV = () => {
    const header = ['id','name','date','keywords','authors','abstract','link'];
    const rows = items.map(i => header
      .map(h => {
        const v = (i as any)[h] ?? '';
        return `"${String(v).replace(/"/g,'""')}"`;
      })
      .join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'celestia_graph_articulos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const createGoogleSheetShortcut = () => {
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
    setTimeout(() => exportCSV(), 600);
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
        }}>Carrito / Lista</h2>
        <Link to="/" style={{textDecoration:'none', fontSize:'.65rem', padding:'.4rem .65rem', border:'1px solid #25405a', borderRadius:'.6rem', background:'#0d1c2b', color:'#8fb6ff'}}>Inicio</Link>
        <Link to="/graph-sun" style={{textDecoration:'none', fontSize:'.65rem', padding:'.4rem .65rem', border:'1px solid #25405a', borderRadius:'.6rem', background:'#0d1c2b', color:'#8fb6ff'}}>Volver grafo</Link>
      </div>

      <div style={{display:'flex', gap:'.6rem', flexWrap:'wrap', margin:'0 0 1rem'}}>
        <button onClick={exportPDF} className="exp-btn" style={btnStyle('#43e9ff','#102132')}>PDF</button>
        <button onClick={exportCSV} className="exp-btn" style={btnStyle('#ffb347','#20140a')}>CSV</button>
        <button onClick={createGoogleSheetShortcut} style={btnStyle('#b4ff4d','#14210a')}>Crear hoja (Sheets)</button>
        <button onClick={clear} disabled={!items.length} style={{...btnStyle('#ff3f5e','#2a0d14'), opacity: items.length?1:.4}}>Vaciar</button>
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
              {['ID','Nombre','Fecha','Keywords','Autores','Abstract','Enlace','Acción'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} style={{padding:'1.4rem', textAlign:'center', fontSize:'.75rem', opacity:.6}}>
                  No hay elementos aún. Ve al grafo y agrega con “Agregar a la lista...”.
                </td>
              </tr>
            )}
            {items.map(it => (
              <tr key={it.id} style={{borderTop:'1px solid #1a3146'}}>
                <td style={tdStyle}>{it.id}</td>
                <td style={tdStyle}>{it.name}</td>
                <td style={tdStyle}>{it.date}</td>
                <td style={tdStyle}>{it.keywords}</td>
                <td style={tdStyle}>{it.authors}</td>
                <td style={{...tdStyle, maxWidth:'260px', lineHeight:1.25}}>
                  <span style={{display:'inline-block', whiteSpace:'normal'}}>
                    {it.abstract}
                  </span>
                </td>
                <td style={tdStyle}>
                  {it.link === '#' ? '-' : (
                    <a href={it.link} target="_blank" rel="noreferrer" style={{color:'#4ad4ff'}}>
                      enlace
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
                  >Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{fontSize:'.6rem', opacity:.55, marginTop:'1rem', lineHeight:1.4}}>
        Exporta como PDF o CSV. El PDF genera una tabla estructurada; el CSV puede importarse en Google Sheets.
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
