import React, { useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { items, removeItem, clear } = useCart();

  const total = useMemo(
    () => items.reduce((acc, it) => acc + parseFloat(it.price), 0).toFixed(2),
    [items]
  );

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('CelestiaGraph - Lista de Artículos', 40, 48);
    doc.setFontSize(10);
    let y = 78;
    doc.text(`Total items: ${items.length} | Total $: ${total}`, 40, y);
    y += 20;
    doc.setFontSize(9);
    items.forEach((it, idx) => {
      if (y > 760) { doc.addPage(); y = 60; }
      doc.text(
        `${idx + 1}. ${it.label} | Cat: ${it.category} | Depth: ${it.depth} | Energy: ${it.energy} | $${it.price}`,
        40,
        y
      );
      y += 16;
    });
    doc.save('celestia_graph_lista.pdf');
  };

  const exportCSV = () => {
    const header = ['id','label','category','depth','energy','price','addedAt','note'];
    const rows = items.map(i => header.map(h => `"${(i as any)[h] ?? ''}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'celestia_graph_lista.csv';
    a.click();
    URL.revokeObjectURL(url);
    // Sugerencia: subir este CSV a Google Drive y abrir Sheets o importar directamente
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
        <button onClick={exportPDF} className="exp-btn" style={btnStyle('#43e9ff','#102132')}>Descargar PDF</button>
        <button onClick={exportCSV} className="exp-btn" style={btnStyle('#ffb347','#20140a')}>Exportar CSV</button>
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
        <table style={{width:'100%', borderCollapse:'collapse', minWidth:'860px'}}>
          <thead>
            <tr style={{background:'#132739'}}>
              {['#','Label','Categoría','Depth','Energy','Precio $','Añadido','Acción'].map(h => (
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
            {items.map((it, idx) => (
              <tr key={it.id} style={{borderTop:'1px solid #1a3146'}}>
                <td style={tdStyle}>{idx+1}</td>
                <td style={tdStyle}>{it.label}</td>
                <td style={tdStyle}>{it.category}</td>
                <td style={tdStyle}>{it.depth}</td>
                <td style={tdStyle}>{it.energy}</td>
                <td style={{...tdStyle, color:'#ffcf7b', fontWeight:600}}>{it.price}</td>
                <td style={tdStyle}>{new Date(it.addedAt).toLocaleString()}</td>
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
            {items.length > 0 && (
              <tr style={{background:'#132739'}}>
                <td style={{...tdStyle, fontWeight:700}} colSpan={5}>Totales</td>
                <td style={{...tdStyle, fontWeight:700, color:'#ffcf7b'}}>{total}</td>
                <td style={tdStyle} colSpan={2}>{items.length} items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{fontSize:'.6rem', opacity:.55, marginTop:'1rem', lineHeight:1.4}}>
        Exporta CSV y súbelo / impórtalo manualmente en Google Sheets (Archivo &gt; Importar). El botón "Crear hoja (Sheets)" abre una nueva hoja y luego descarga el CSV automáticamente.
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
