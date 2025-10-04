import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/sunTheme.css'; // añadido para tooltips y hover de soles
import './styles/spaceBackground.css'; // Importar estilos de spaceBackground globalmente
// import './styles/transition.css'; // eliminado
import AppRouter from './router/AppRouter';

// Montaje principal
createRoot(document.getElementById('root')!).render(
  <>
    <AppRouter />
  </>
);