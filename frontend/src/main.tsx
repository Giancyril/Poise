import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Ambient mesh background — fixed, behind all content */}
    <div className="ambient-bg" aria-hidden="true" />
    {/* Subtle noise grain for premium texture */}
    <div className="noise-overlay" aria-hidden="true" />
    <App />
  </StrictMode>,
)
