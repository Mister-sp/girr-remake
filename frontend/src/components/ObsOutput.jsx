import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import LowerThird from './LowerThird';
import matrixBg from '../assets/default-logo.js';
import { connectWebSocket } from '../services/websocket';

// Utilitaire pour extraire l'ID YouTube depuis une URL (classique, embed ou courte)
function extractYoutubeId(url) {
  if (!url) return '';
  // Gère tous les formats possibles (watch, embed, youtu.be, shorts, etc.)
  const regExp = /(?:youtube\.com\/(?:.*v=|.*\/embed\/|.*\/shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) return match[1];
  // Cas fallback : si l’URL contient v=ID dans les query params
  try {
    const urlObj = new URL(url, window.location.origin);
    if (urlObj.searchParams.has('v')) return urlObj.searchParams.get('v');
  } catch (e) {}
  return '';
}

// Blague React pour les devs curieux :
// Pourquoi les développeurs React aiment-ils les hooks ?
// Parce qu’ils ne supportaient plus d’être classés !

export default function ObsOutput({ previewMode = false, current: propsCurrent, mediaDisplayed: propsMedia }) {
  // Synchronisation multi-onglets OBS (BroadcastChannel)
  const obsSyncChannel = useRef(previewMode ? null : new BroadcastChannel('obs-sync'));
  
  const [currentScale, setCurrentScale] = useState(1);
  
  const [current, setCurrent] = useState(propsCurrent || {
    program: '',
    episode: '',
    topic: '',
    title: '',
    subtitle: '',
    background: matrixBg,
    logoUrl: '/default-logo.png',
    logoEffect: '',
    logoPosition: 'top-right',
    logoSize: 80,
    lowerThirdConfig: null,
    media: null  // Ajout explicite de media: null dans l'état initial
  });

  const [displayedMedia, setDisplayedMedia] = useState(propsMedia || null);
  const [isMediaVisible, setIsMediaVisible] = useState(false);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    // En mode preview, on utilise les props au lieu du channel
    if (previewMode) {
      if (propsCurrent) {
        setCurrent(propsCurrent);
      }
      // Gestion explicite du changement de média en mode preview
      if (propsCurrent?.media !== undefined) {
        setDisplayedMedia(propsCurrent.media);
        setIsMediaVisible(!!propsCurrent.media);
      }
      return;
    }

    // Mode normal : utiliser le channel
    const channel = obsSyncChannel.current;
    const handler = (event) => {
      if (event.data?.type === 'TOPIC_UPDATE') {
        setCurrent(prev => ({
          ...prev,
          title: event.data.topic.title || '',
          logoUrl: event.data.topic.programLogo || '/default-logo.png',
          program: event.data.topic.programTitle || '',
          episode: event.data.topic.episodeTitle || ''
        }));
      }
    };

    if (channel) {
      channel.addEventListener('message', handler);
      return () => {
        channel.removeEventListener('message', handler);
        channel.close();
      };
    }
  }, [previewMode, propsCurrent, propsMedia]);

  // Applique la classe obs-output
  useEffect(() => {
    if (!previewMode) {
      document.body.classList.add('obs-output');
      document.documentElement.classList.add('obs-output');
      return () => {
        document.body.classList.remove('obs-output');
        document.documentElement.classList.remove('obs-output');
      };
    }
  }, [previewMode]);

  const [searchParams] = useSearchParams();

  // Récupère les paramètres d'URL (pour forcer un affichage précis si besoin)
  useEffect(() => {
    setCurrent((prev) => ({
      ...prev,
      program: searchParams.get('program') || '',
      episode: searchParams.get('episode') || '',
      topic: searchParams.get('topic') || '',
    }));
  }, [searchParams]);

  // WebSocket connection uniquement en mode normal
  useEffect(() => {
    if (previewMode) return;

    const socket = connectWebSocket();

    const handleUpdate = (data) => {
      console.log('[OBS] Reçu obs:update', data);
      
      setCurrent(prev => ({
        ...prev,
        title: data.title ?? prev.title,
        subtitle: data.subtitle ?? prev.subtitle,
        background: data.background ?? prev.background,
        logoUrl: data.logoUrl ?? prev.logoUrl,
        logoEffect: data.logoEffect ?? prev.logoEffect,
        logoPosition: data.logoPosition ?? prev.logoPosition,
        logoSize: data.logoSize ?? prev.logoSize,
        lowerThirdConfig: data.lowerThirdConfig ?? prev.lowerThirdConfig,
        program: data.program ?? prev.program,
        episode: data.episode ?? prev.episode,
        topic: data.topic ?? prev.topic,
      }));

      const newMedia = data.media;

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }

      setDisplayedMedia(currentDisplayedMedia => {
        if (JSON.stringify(newMedia) !== JSON.stringify(currentDisplayedMedia)) {
          if (currentDisplayedMedia) {
            setIsMediaVisible(false);
            transitionTimeoutRef.current = setTimeout(() => {
              setDisplayedMedia(newMedia);
              if (newMedia) {
                requestAnimationFrame(() => {
                  setIsMediaVisible(true);
                });
              }
              transitionTimeoutRef.current = null;
            }, 500);
            return currentDisplayedMedia;
          } else if (newMedia) {
            setDisplayedMedia(newMedia);
            requestAnimationFrame(() => {
              setIsMediaVisible(true);
            });
            return newMedia;
          } else {
            setDisplayedMedia(null);
            setIsMediaVisible(false);
            return null;
          }
        }
        return currentDisplayedMedia;
      });
    };

    socket.on('obs:update', handleUpdate);

    // Send registration with type
    socket.emit('register', { pathname: '/obs', type: 'obs-full' });

    return () => {
      socket.off('obs:update', handleUpdate);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [previewMode]);

  // --- Auto-scale pour mini-OBS ou plein écran ---
  useEffect(() => {
    if (previewMode) return; // Pas de scale en mode preview

    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCurrentScale(Math.min(w / 1920, h / 1080));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [previewMode]);

  return (
    <div className="obs-output-root" style={{
      width: 1920,
      height: 1080,
      transform: `scale(${currentScale})`,
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
      {typeof current.logoUrl === 'string' && current.logoUrl && current.logoUrl !== '/default-logo.png' && (
        <img
          src={
            current.logoUrl.startsWith('http') || current.logoUrl.startsWith('data:')
              ? current.logoUrl
              : `http://localhost:3001${current.logoUrl}`
          }
          alt="logo"
          className={(() => {
            switch (current.logoEffect) {
              case 'float': return 'logo-floating';
              case 'glitch': return 'logo-glitch';
              case 'pulse': return 'logo-pulse';
              case 'oldtv': return 'logo-oldtv';
              case 'vhs': return 'logo-vhs';
              default: return '';
            }
          })()}
          style={{
            position: 'absolute',
            ...(() => {
              switch (current.logoPosition) {
                case 'top-left': return { top: 28, left: 36 };
                case 'top-center': return { top: 28, left: '50%', transform: 'translateX(-50%)' };
                case 'top-right': return { top: 28, right: 36 };
                case 'bottom-left': return { bottom: 28, left: 36 };
                case 'bottom-center': return { bottom: 28, left: '50%', transform: 'translateX(-50%)' };
                case 'bottom-right': return { bottom: 28, right: 36 };
                default: return { top: 28, right: 36 };
              }
            })(),
            width: current.logoSize ?? 80,
            height: current.logoSize ?? 80,
            objectFit: 'contain',
            borderRadius: 18,
            boxShadow: '0 2px 12px #0007',
            background: 'transparent',
            zIndex: 100,
            ...(current.logoEffect === 'glitch' ? {'--glitch-intensity': current.logoEffectIntensity ?? 5} : {}),
            ...(current.logoEffect === 'oldtv' ? {'--oldtv-intensity': current.logoEffectIntensity ?? 5} : {}),
            ...(current.logoEffect === 'vhs' ? {'--vhs-intensity': current.logoEffectIntensity ?? 5} : {}),
          }}
        />
      )}
      {/* Image d'illustration centrée */}
      {displayedMedia && displayedMedia.type === 'image' && (
        <img
          src={displayedMedia.url}
          alt="media"
          className={`media-fade ${isMediaVisible ? 'visible' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1920px',
            height: '1080px',
            minWidth: '100%',
            minHeight: '100%',
            objectFit: 'cover',
            borderRadius: 0,
            boxShadow: 'none',
            background: '#000',
            zIndex: 10,
            display: 'block',
          }} />
      )}
      {displayedMedia && displayedMedia.type === 'youtube' && (
        <iframe
          src={(function getYoutubeEmbedUrl(url) {
            let embedUrl;
            if (url.includes('embed')) {
              // Ajoute ou force autoplay=1
              if (url.includes('autoplay=')) {
                embedUrl = url.replace(/autoplay=\d/, 'autoplay=1');
              if (!embedUrl.includes('mute=1')) embedUrl += '&mute=1';
              } else if (url.includes('?')) {
                embedUrl = url + '&autoplay=1&mute=1';
              } else {
                embedUrl = url + '?autoplay=1&mute=1';
              }
            } else {
              // Sinon, construit l'URL embed
              embedUrl = `https://www.youtube.com/embed/${extractYoutubeId(url)}?autoplay=1&mute=1&controls=0&showinfo=0&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=0`;
            }
            console.log('[OBS] URL iframe YouTube:', embedUrl);
            return embedUrl;
          })(displayedMedia.url)}
          className={`media-fade ${isMediaVisible ? 'visible' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1920px',
            height: '1080px',
            minWidth: '100%',
            minHeight: '100%',
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
            background: '#000',
            zIndex: 10,
            display: 'block',
            objectFit: 'cover',
          }}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube video"
        />
      )}
      {/* Lower third titrage */}
      {current.title && (
        <LowerThird
          title={current.title}
          subtitle={current.subtitle}
          {...(current.lowerThirdConfig || {})}
          logoUrl={current.logoUrl}
        />
      )}
    </div>
  );
}
