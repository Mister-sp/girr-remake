/**
 * Composant racine de l'application.
 * @module App
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './components/LoginPage';
import AppWithNavigation from './AppWithNavigation';
import ObsOutput from './components/ObsOutput';
import ObsMediaOutput from './components/ObsMediaOutput';
import ObsTitrageOutput from './components/ObsTitrageOutput';
import { KeyBindingsProvider } from './components/KeyBindingsContext';
import { PerformanceProvider } from './components/PerformanceProvider';
import './App.css';
import NotificationSystem from './components/NotificationSystem';

/**
 * Composant racine avec le routage et les providers.
 * 
 * Routes disponibles :
 * - /login : Page de connexion
 * - / : Interface principale de contrôle (protégée)
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
            {/* Page de connexion */}
            <Route path="/login" element={<LoginPage />} />

            {/* Interface principale (protégée) */}
            <Route 
              path="/*" 
              element={
                <PrivateRoute>
                  <AppWithNavigation />
                </PrivateRoute>
              } 
            />

            {/* Fenêtres OBS (protégées) */}
            <Route 
              path="/obs" 
              element={
                <PrivateRoute>
                  <ObsOutput />
                </PrivateRoute>
              }
            />
            <Route 
              path="/obs-media" 
              element={
                <PrivateRoute>
                  <ObsMediaOutput />
                </PrivateRoute>
              }
            />
            <Route 
              path="/obs-titrage" 
              element={
                <PrivateRoute>
                  <ObsTitrageOutput />
                </PrivateRoute>
              }
            />

            {/* Redirection par défaut */}
            <Route 
              path="*" 
              element={<Navigate to="/" replace />}
            />
          </Routes>
          <NotificationSystem />
        </BrowserRouter>
      </KeyBindingsProvider>
    </PerformanceProvider>
  );
}
