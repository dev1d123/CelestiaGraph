import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import NavBar from './components/NavBar.tsx'
import HeroMain from './components/HeroMain.tsx'
import LineDiv from './components/LineDiv.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavBar />
    <HeroMain />
    <LineDiv/>
  </StrictMode>,
)
NavBar