import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './obs-output.css'

// Applique la classe obs-output dès le chargement JS (utile pour OBS)
document.body.classList.add('obs-output');
document.documentElement.classList.add('obs-output');
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
