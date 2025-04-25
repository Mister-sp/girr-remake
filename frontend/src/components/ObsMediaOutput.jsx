import React, { useEffect, useState } from 'react';
import './logo-effects.css';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';


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

const matrixBg = 'https://assets.codepen.io/1468070/matrix-bg.jpg';
const socket = io('http://localhost:3001');

export default function ObsMediaOutput() {
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
    media: null,
    logoUrl: '/default-logo.png',
    background: matrixBg,
  });

  useEffect(() => {
    socket.on('obs:update', (data) => {
      setCurrent((prev) => ({ ...prev, ...data }));
    });
    return () => socket.off('obs:update');
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
      background: current.media ? '#000' : 'none',
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
          }}
        />
      )}
      {/* Image d'illustration centrée */}
      {current.media && current.media.type === 'image' && (
        <img src={current.media.url} alt="media" style={{
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
          background: current.media ? '#000' : 'none',
          zIndex: 10,
          display: 'block',
        }} />
      )}
      {current.media && current.media.type === 'youtube' && (
        <iframe
          src={getYoutubeEmbedUrl(current.media.url)}
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
            background: current.media ? '#000' : 'none',
            zIndex: 10,
            display: 'block',
            objectFit: 'cover'
          }}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube video"
        />
      )}
    </div>
  );
}
