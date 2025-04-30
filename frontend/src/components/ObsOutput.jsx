import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';

import LowerThird from './LowerThird';

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


// Fond matrix par défaut
const matrixBg = 'https://assets.codepen.io/1468070/matrix-bg.jpg'; // Remplace par asset local si besoin

const socket = io('http://localhost:3001');
socket.on('connect', () => {
  console.log('[OBS] Connecté au WebSocket, id:', socket.id);
});
socket.on('connect_error', (err) => {
  console.error('[OBS] Erreur WebSocket :', err);
});
socket.on('disconnect', () => {
  console.warn('[OBS] Déconnecté du WebSocket');
});

// Blague React pour les devs curieux :
// Pourquoi les développeurs React aiment-ils les hooks ?
// Parce qu’ils ne supportaient plus d’être classés !

export default function ObsOutput() {
  // Synchronisation multi-onglets OBS (BroadcastChannel)
  useEffect(() => {
    const channel = new window.BroadcastChannel('obs-sync');
    const handler = (event) => {
      if (event.data?.type === 'CHANGE_VIEW' && event.data.url && window.location.pathname !== event.data.url) {
        window.location.href = event.data.url;
      }
    };
    channel.addEventListener('message', handler);
    return () => channel.close();
  }, []);
  // Applique la classe obs-output au body et html pour fond clean
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
    lowerThirdConfig: {},
  });

  // State for the media currently rendered or transitioning out
  const [displayedMedia, setDisplayedMedia] = useState(null);
  // State to control the visibility class for fade effect
  const [isMediaVisible, setIsMediaVisible] = useState(false);
  // Ref to store the timeout ID
  const transitionTimeoutRef = useRef(null);

  // Récupère les paramètres d'URL (pour forcer un affichage précis si besoin)
  useEffect(() => {
    setCurrent((prev) => ({
      ...prev,
      program: searchParams.get('program') || '',
      episode: searchParams.get('episode') || '',
      topic: searchParams.get('topic') || '',
    }));
  }, [searchParams]);

  // Synchronisation temps réel (topic/media courant)
  useEffect(() => {
    const handleUpdate = (data) => {
      console.log('[OBS] Reçu obs:update', data);
      // Update non-media settings directly
      setCurrent((prev) => ({
         ...prev,
         title: data.title ?? prev.title,
         subtitle: data.subtitle ?? prev.subtitle,
         background: data.background ?? prev.background,
         logoUrl: data.logoUrl ?? prev.logoUrl,
         logoEffect: data.logoEffect ?? prev.logoEffect,
         logoPosition: data.logoPosition ?? prev.logoPosition,
         logoSize: data.logoSize ?? prev.logoSize,
         lowerThirdConfig: data.lowerThirdConfig ?? prev.lowerThirdConfig,
         // Keep program, episode, topic if they are not in data
         program: data.program ?? prev.program,
         episode: data.episode ?? prev.episode,
         topic: data.topic ?? prev.topic,
        }));

      const newMedia = data.media; // Media from the update

      // Clear any pending transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }

      // Check if media content has actually changed
      setDisplayedMedia(currentDisplayedMedia => {
        if (JSON.stringify(newMedia) !== JSON.stringify(currentDisplayedMedia)) {
          if (currentDisplayedMedia) {
            // 1. Start fade-out of the current media
            setIsMediaVisible(false);

            // 2. After fade-out duration, update media and fade-in (if new media exists)
            transitionTimeoutRef.current = setTimeout(() => {
              // Update displayedMedia state AFTER the timeout
              setDisplayedMedia(newMedia);
              if (newMedia) {
                // Use rAF to ensure the state update is processed before adding 'visible'
                requestAnimationFrame(() => {
                   setIsMediaVisible(true);
                });
              }
              transitionTimeoutRef.current = null; // Clear ref after execution
            }, 500); // Match CSS transition duration (0.5s)
            // Keep the current media displayed during fade-out
            return currentDisplayedMedia;
          } else if (newMedia) {
            // No media currently displayed, just set and fade-in the new one
             setDisplayedMedia(newMedia); // Update immediately
             requestAnimationFrame(() => {
               setIsMediaVisible(true);
            });
            return newMedia; // Return the new media state
          } else {
            // New media is null, and nothing was displayed or is fading out.
            setDisplayedMedia(null); // Update immediately
            setIsMediaVisible(false);
            return null; // Return the new media state
          }
        }
        // If media hasn't changed, return the current state
        return currentDisplayedMedia;
      });
    };

    socket.on('obs:update', handleUpdate);
    return () => {
        socket.off('obs:update', handleUpdate);
         // Clear timeout on component unmount
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }
    };
  }, []); // Empty dependency array: runs once

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
