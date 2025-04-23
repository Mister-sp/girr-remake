import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import logo from '../assets/default-logo.png';
import LowerThird from './LowerThird';

const matrixBg = 'https://assets.codepen.io/1468070/matrix-bg.jpg';
const socket = io('http://localhost:3001');

export default function ObsTitrageOutput() {
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
    title: '',
    subtitle: '',
    logoUrl: logo,
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

  const showTitrage = current.title || current.subtitle;

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
      background: 'none',
      fontFamily: 'Inter, Arial, sans-serif',
      margin: 0,
      padding: 0,
      border: 'none',
      boxSizing: 'border-box',
      zIndex: 99999,
    }}>
      {/* Lower third titrage */}
      {showTitrage && <LowerThird title={current.title} subtitle={current.subtitle} />}
    </div>
  );
}
