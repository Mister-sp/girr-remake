/**
 * Composant racine de l'application.
 * @module App
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppWithNavigation from './AppWithNavigation';
import ObsOutput from './components/ObsOutput';
import ObsMediaOutput from './components/ObsMediaOutput';
import ObsTitrageOutput from './components/ObsTitrageOutput';
import { KeyBindingsProvider } from './components/KeyBindingsContext';
import { PerformanceProvider } from './components/PerformanceProvider';
import './App.css';

/**
 * Composant racine avec le routage et les providers.
 * 
 * Routes disponibles :
 * - / : Interface principale de contrôle
 * - /obs : Sortie OBS complète (média + titrage)
 * - /obs-media : Sortie OBS médias seuls
 * - /obs-titrage : Sortie OBS titrage seul
 * 
 * @component
 */
export default function App() {
  return (
    <PerformanceProvider>
      <KeyBindingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Interface principale */}
            <Route 
              path="/*" 
              element={<AppWithNavigation />} 
            />

            {/* Fenêtres OBS */}
            <Route 
              path="/obs" 
              element={<ObsOutput />}
            />
            <Route 
              path="/obs-media" 
              element={<ObsMediaOutput />}
            />
            <Route 
              path="/obs-titrage" 
              element={<ObsTitrageOutput />}
            />

            {/* Redirection par défaut */}
            <Route 
              path="*" 
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </BrowserRouter>
      </KeyBindingsProvider>
    </PerformanceProvider>
  );
}
