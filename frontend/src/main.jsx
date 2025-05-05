import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './obs-output.css'
import { startTokenRefresher } from './services/tokenRefresher'

// Applique la classe obs-output dès le chargement JS (utile pour OBS)
document.body.classList.add('obs-output');
document.documentElement.classList.add('obs-output');

// Démarrer le service de rafraîchissement automatique des tokens
startTokenRefresher();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
