/**
 * Barre de statut avec navigation et informations système.
 * @module components/StatusBar
 */

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ConnectedClients from './ConnectedClients';
import { getSocket } from '../services/websocket';

/**
 * Affiche une barre de statut fixe en bas de l'écran.
 * 
 * Contient :
 * - Le fil d'Ariane de navigation
 * - Le nombre de clients connectés
 * - Le status de la connexion WebSocket
 * - Une prévisualisation OBS si activée
 * 
 * @component
 * @param {Object} props
 * @param {boolean} [props.showPreview=false] - Afficher la prévisualisation OBS
 */
export default function StatusBar({ showPreview = false }) {
  const location = useLocation();
  const [wsStatus, setWsStatus] = useState('disconnected');

  // Surveiller le statut WebSocket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const updateStatus = () => setWsStatus('connected');
    const updateDisconnected = () => setWsStatus('disconnected');
    const updateError = () => setWsStatus('error');

    socket.on('connect', updateStatus);
    socket.on('disconnect', updateDisconnected);
    socket.on('connect_error', updateError);

    return () => {
      socket.off('connect', updateStatus);
      socket.off('disconnect', updateDisconnected);
      socket.off('connect_error', updateError);
    };
  }, []);

  /**
   * Génère le fil d'Ariane à partir du chemin.
   * @returns {Array} Segments du fil d'Ariane
   */
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const breadcrumbs = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  return (
    <footer className="status-bar">
      {/* Navigation */}
      <nav className="breadcrumbs">
        <Link to="/">Accueil</Link>
        {getBreadcrumbs().map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <span className="separator">/</span>
            <Link to={crumb.path}>{crumb.name}</Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Informations système */}
      <div className="system-status">
        <ConnectedClients />
        <div className={`ws-status ${wsStatus}`}>
          {wsStatus === 'connected' && '🟢'}
          {wsStatus === 'disconnected' && '🔴'}
          {wsStatus === 'error' && '🟡'}
          WebSocket
        </div>
      </div>

      {/* Prévisualisation OBS */}
      {showPreview && (
        <div className="obs-preview-container">
          <ObsOutput previewMode />
        </div>
      )}
    </footer>
  );
}