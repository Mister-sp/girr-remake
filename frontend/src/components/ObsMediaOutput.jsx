import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import matrixBg from '../assets/default-logo.js';
import { connectWebSocket } from '../services/websocket';

// Utilitaire pour extraire l'ID YouTube depuis une URL (classique, embed ou courte)
function extractYoutubeId(url) {
  if (!url) return '';
  const regExp = /(?:youtube\.com\/(?:.*v=|.*\/embed\/|.*\/shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) return match[1];
  try {
    const urlObj = new URL(url, window.location.origin);
    if (urlObj.searchParams.has('v')) return urlObj.searchParams.get('v');
  } catch (e) {}
  return '';
}
function getYoutubeEmbedUrl(url) {
  const id = extractYoutubeId(url);
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&showinfo=0&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=0`
    : '';
}

export default function ObsMediaOutput() {
  // Synchronisation multi-onglets OBS (BroadcastChannel)
  const obsSyncChannel = useRef(new BroadcastChannel('obs-sync'));
  
  useEffect(() => {
    const channel = obsSyncChannel.current;
    const handler = (event) => {
      if (event.data?.type === 'TOPIC_UPDATE') {
        setCurrentSettings(prev => ({
          ...prev,
          logoUrl: event.data.topic.programLogo || '/default-logo.png'
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
  const [currentSettings, setCurrentSettings] = useState({
    logoUrl: '/default-logo.png',
    background: matrixBg,
    logoEffect: '',
    logoPosition: 'top-right',
    logoSize: 80,
    mediaAppearEffect: 'fade',
    mediaDisappearEffect: 'fade'
  });

  // Charger les paramètres globaux au démarrage
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/settings/transitions');
        if (!res.ok) return;
        const data = await res.json();
        setCurrentSettings(prev => ({
          ...prev,
          mediaAppearEffect: data.appearEffect || 'fade',
          mediaDisappearEffect: data.disappearEffect || 'fade'
        }));

        // Appliquer les variables CSS
        document.documentElement.style.setProperty('--media-transition-duration', `${data.duration || 0.5}s`);
        document.documentElement.style.setProperty('--media-transition-timing', data.timing || 'ease-in-out');
        document.documentElement.style.setProperty('--media-slide-distance', `${data.slideDistance || 40}px`);
        document.documentElement.style.setProperty('--media-zoom-scale', data.zoomScale || 0.8);
        document.documentElement.style.setProperty('--media-rotate-angle', `${data.rotateAngle || -10}deg`);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres globaux:', error);
      }
    };
    loadGlobalSettings();
  }, []);

  // Écouter les mises à jour des paramètres globaux
  useEffect(() => {
    const handleSettingsUpdate = (data) => {
      setCurrentSettings(prev => ({
        ...prev,
        mediaAppearEffect: data.appearEffect || prev.mediaAppearEffect,
        mediaDisappearEffect: data.disappearEffect || prev.mediaDisappearEffect
      }));

      // Mettre à jour les variables CSS
      document.documentElement.style.setProperty('--media-transition-duration', `${data.duration || 0.5}s`);
      document.documentElement.style.setProperty('--media-transition-timing', data.timing || 'ease-in-out');
      document.documentElement.style.setProperty('--media-slide-distance', `${data.slideDistance || 40}px`);
      document.documentElement.style.setProperty('--media-zoom-scale', data.zoomScale || 0.8);
      document.documentElement.style.setProperty('--media-rotate-angle', `${data.rotateAngle || -10}deg`);
    };

    socket.on('settings:transitions:update', handleSettingsUpdate);
    return () => socket.off('settings:transitions:update', handleSettingsUpdate);
  }, []);

  // State for the media currently rendered or transitioning out
  const [displayedMedia, setDisplayedMedia] = useState(null);
  // State to control the visibility class for fade effect
  const [isMediaVisible, setIsMediaVisible] = useState(false);
  // Ref to store the timeout ID
  const transitionTimeoutRef = useRef(null);
  const [currentEffectClass, setCurrentEffectClass] = useState('');
  const [isMediaActive, setIsMediaActive] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const socket = connectWebSocket();

    const handleUpdate = (data) => {
      console.log('[OBS] Reçu obs:update', data);
      
      // Update non-media settings
      setCurrentSettings(prev => ({
        ...prev,
        logoUrl: data.logoUrl ?? prev.logoUrl,
        logoEffect: data.logoEffect ?? prev.logoEffect,
        logoPosition: data.logoPosition ?? prev.logoPosition,
        logoSize: data.logoSize ?? prev.logoSize
      }));

      // Media update logic
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      const newMedia = data.media;
      const newAppearEffect = data.appearEffect || 'fade';

      setDisplayedMedia(currentDisplayedMedia => {
        if (JSON.stringify(newMedia) !== JSON.stringify(currentDisplayedMedia)) {
          setIsMediaActive(false);
          if (currentDisplayedMedia) {
            transitionTimeoutRef.current = setTimeout(() => {
              if (newMedia) {
                setDisplayedMedia(newMedia);
                setCurrentEffectClass(`effect-${newAppearEffect}`);
                requestAnimationFrame(() => {
                  setIsMediaActive(true);
                });
              } else {
                setDisplayedMedia(null);
                setIsMediaActive(false);
              }
              transitionTimeoutRef.current = null;
            }, 500);
            return currentDisplayedMedia;
          } else if (newMedia) {
            setDisplayedMedia(newMedia);
            setCurrentEffectClass(`effect-${newAppearEffect}`);
            requestAnimationFrame(() => {
              setIsMediaActive(true);
            });
            return newMedia;
          } else {
            setIsMediaVisible(false);
            return null;
          }
        }
        return currentDisplayedMedia;
      });
    };

    socket.on('obs:update', handleUpdate);
    
    // Register as obs-media type client
    socket.emit('register', { pathname: '/obs-media', type: 'obs-media' });

    return () => {
      socket.off('obs:update', handleUpdate);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // --- Auto-scale pour mini-OBS ou plein écran ---
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

  return (
    <div className="obs-output-root" style={{
      width: 1920,
      height: 1080,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      background: displayedMedia ? '#000' : 'none',
      fontFamily: 'Inter, Arial, sans-serif',
      margin: 0,
      padding: 0,
      border: 'none',
      boxSizing: 'border-box',
      zIndex: 99999,
    }}>
      {/* Logo émission en haut à droite */}
      {typeof currentSettings.logoUrl === 'string' && currentSettings.logoUrl && currentSettings.logoUrl !== '/default-logo.png' && (
        <img
          src={
            currentSettings.logoUrl.startsWith('http') || currentSettings.logoUrl.startsWith('data:')
              ? currentSettings.logoUrl
              : `http://localhost:3001${currentSettings.logoUrl}`
          }
          alt="logo"
          className={(() => {
                switch (currentSettings.logoEffect) {
                    case 'float': return 'logo-floating';
                    case 'glitch': return 'logo-glitch';
                    case 'pulse': return 'logo-pulse';
                    case 'oldtv': return 'logo-oldtv';
                    default: return '';
                }
            })()}
          style={{
            position: 'absolute',
            ...(() => {
              switch (currentSettings.logoPosition) {
                case 'top-left': return { top: 28, left: 36 };
                case 'top-center': return { top: 28, left: '50%', transform: 'translateX(-50%)' };
                case 'top-right': return { top: 28, right: 36 };
                case 'bottom-left': return { bottom: 28, left: 36 };
                case 'bottom-center': return { bottom: 28, left: '50%', transform: 'translateX(-50%)' };
                case 'bottom-right': return { bottom: 28, right: 36 };
                default: return { top: 28, right: 36 };
              }
            })(),
            width: currentSettings.logoSize ?? 80,
            height: currentSettings.logoSize ?? 80,
            objectFit: 'contain',
            borderRadius: 18,
            boxShadow: '0 2px 12px #0007',
            background: 'transparent',
            zIndex: 100,
          }}
        />
      )}
      {/* Media Container */}
      {displayedMedia && (
        <div className={`media-container ${currentEffectClass} ${isMediaActive ? 'active' : ''}`}>
          {displayedMedia.type === 'image' && (
            <img
              src={displayedMedia.url}
              alt="media"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
          {displayedMedia.type === 'youtube' && (
            <iframe
              src={getYoutubeEmbedUrl(displayedMedia.url)}
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="YouTube video"
              style={{ width: '100%', height: '100%' }}
            />
          )}
          {displayedMedia.type === 'video' && (
            <video
              src={displayedMedia.url}
              autoPlay
              loop={displayedMedia.loop}
              muted={displayedMedia.muted}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
