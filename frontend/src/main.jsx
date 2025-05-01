import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { PerformanceProvider } from './components/PerformanceProvider'
import './index.css'
import './obs-output.css'

// Applique la classe obs-output dès le chargement JS (utile pour OBS)
document.body.classList.add('obs-output');
document.documentElement.classList.add('obs-output');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PerformanceProvider>
        <App />
      </PerformanceProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
