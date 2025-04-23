import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function ObsMediaOutput() {
  useEffect(() => {
    document.body.classList.add('obs-output');
    document.documentElement.classList.add('obs-output');
    return () => {
      document.body.classList.remove('obs-output');
      document.documentElement.classList.remove('obs-output');
    };
  }, []);
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState({ media: null });

  useEffect(() => {
    socket.on('obs:update', (data) => setCurrent((prev) => ({ ...prev, ...data })));
    return () => socket.off('obs:update');
  }, []);

  // Transparence si rien à afficher
  const showMedia = current.media && (current.media.type === 'image' || current.media.type === 'youtube');

  return (
    <div className="obs-output-root" style={{
      width: 1920,
      height: 1080,
      position: 'fixed',
      top: 0,
      left: 0,
      background: showMedia ? '#000' : 'none',
      zIndex: 99999,
      overflow: 'hidden',
    }}>
      {showMedia && current.media.type === 'image' && (
        <img src={current.media.url} alt="media" style={{
          position: 'absolute',
          top: 0, left: 0, width: '1920px', height: '1080px', objectFit: 'cover',
        }} />
      )}
      {showMedia && current.media.type === 'youtube' && (
        <iframe
          src={current.media.url}
          style={{ position: 'absolute', top: 0, left: 0, width: '1920px', height: '1080px', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      )}
    </div>
  );
}
