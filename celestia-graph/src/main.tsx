import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './router/AppRouter';
import './styles/sunTheme.css'; // añadido para tooltips y hover de soles
// Montaje principal
createRoot(document.getElementById('root')!).render(
  <>
    <AppRouter />
  </>
);