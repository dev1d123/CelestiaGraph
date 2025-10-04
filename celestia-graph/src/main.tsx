import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import  Main from './pages/Main.tsx';

// Montaje principal
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
);