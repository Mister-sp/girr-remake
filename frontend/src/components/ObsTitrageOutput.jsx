import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import LowerThird from './LowerThird';
import matrixBg from '../assets/default-logo.js';
import { connectWebSocket } from '../services/websocket';

export default function ObsTitrageOutput() {
  const obsSyncChannel = useRef(new BroadcastChannel('obs-sync'));
  
  useEffect(() => {
    const channel = obsSyncChannel.current;
    const handler = (event) => {
      if (event.data?.type === 'TOPIC_UPDATE') {
        setCurrent(prev => ({
          ...prev,
          title: event.data.topic.title || '',
          logoUrl: event.data.topic.programLogo || '/default-logo.png',
          subtitle: event.data.topic.programTitle || ''
        }));
      }
    };
    channel.addEventListener('message', handler);
    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
    };
  }, []);

  useEffect(() => {
    document.body.classList.add('obs-output');
    document.documentElement.classList.add('obs-output');
    return () => {
      document.body.classList.remove('obs-output');
      document.documentElement.classList.remove('obs-output');
    };
  }, []);

  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState({
    title: '',
    subtitle: '',
    logoUrl: '/default-logo.png',
    background: matrixBg,
    lowerThirdConfig: {
      position: 'bottom',
      align: 'left',
      titleSize: 36,
      subtitleSize: 24,
      spacing: 8,
      padding: 20,
      marginBottom: 40,
      theme: 'light',
      animation: 'slide',
      customColors: null
    }
  });

  useEffect(() => {
    const socket = connectWebSocket();

    const handleUpdate = (data) => {
      console.log('[OBS] Reçu obs:update', data);
      
      setCurrent(prev => ({
        ...prev,
        title: data.title ?? prev.title,
        subtitle: data.subtitle ?? prev.subtitle,
        logoUrl: data.logoUrl ?? prev.logoUrl,
        lowerThirdConfig: {
          ...prev.lowerThirdConfig,
          ...data.lowerThirdConfig
        }
      }));
    };

    socket.on('obs:update', handleUpdate);

    // Register as obs-titrage type client
    socket.emit('register', { pathname: '/obs-titrage', type: 'obs-titrage' });

    return () => {
      socket.off('obs:update', handleUpdate);
    };
  }, []);

  // Auto-scale logic
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScale(Math.min(w / 1920, h / 1080));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isMobileView, setIsMobileView] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);
  
  return (
    <div className={`obs-output-root${isMobileView ? ' mobile-view' : ''}`} style={{
      width: 1920,
      height: 1080,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'transparent',
      fontFamily: 'Inter, Arial, sans-serif',
      margin: 0,
      padding: 0,
      border: 'none',
      boxSizing: 'border-box',
      zIndex: 99999,
    }}>
      {/* Contrôles adaptés au mobile */}
      <div className="titrage-controls" style={{
        position: 'fixed',
        bottom: isMobileView ? 0 : 'auto',
        top: isMobileView ? 'auto' : 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: isMobileView ? '16px 12px' : '12px',
        display: 'flex',
        gap: '12px',
        flexDirection: isMobileView ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        borderRadius: isMobileView ? '16px 16px 0 0' : '0 0 16px 16px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
      }}>
        {/* Boutons de contrôle avec taille adaptée au tactile */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobileView ? '1fr 1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          width: '100%',
          maxWidth: isMobileView ? '100%' : '600px'
        }}>
          <button
            className="control-button"
            style={{
              padding: isMobileView ? '16px' : '8px 16px',
              fontSize: isMobileView ? '1.1rem' : '1rem',
              minHeight: isMobileView ? '44px' : '36px',
              touchAction: 'manipulation'
            }}
            onClick={handleTitleClick}
          >
            {current.title ? 'Masquer titre' : 'Afficher titre'}
          </button>
          {/* ...autres boutons avec les mêmes styles adaptés... */}
        </div>
      </div>
      {current.title && (
        <LowerThird
          title={current.title}
          subtitle={current.subtitle}
          logoUrl={current.logoUrl !== '/default-logo.png' ? current.logoUrl : null}
          {...current.lowerThirdConfig}
        />
      )}
    </div>
  );
}
