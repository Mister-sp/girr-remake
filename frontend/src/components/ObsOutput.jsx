import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import logo from '../assets/default-logo.png';
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

export default function ObsOutput() {
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
    media: null,
    title: '',
    subtitle: '',
    background: matrixBg,
    logoUrl: logo,
  });

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
    socket.on('obs:update', (data) => {
      console.log('[OBS] Reçu obs:update', data);
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
      <img src={current.logoUrl || logo} alt="logo" style={{position:'absolute',top:28,right:36,width:80,height:80,objectFit:'contain',borderRadius:18,boxShadow:'0 2px 12px #0007',background:'transparent'}} />
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
          })(current.media.url)}
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
            objectFit: 'cover',
          }}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube video"
        />
      )}
      {/* Lower third titrage */}
      <LowerThird title={current.title} />
    </div>
  );
}
