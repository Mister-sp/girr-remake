import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import LowerThird from './LowerThird';

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
  const [current, setCurrent] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    socket.on('obs:update', (data) => setCurrent((prev) => ({ ...prev, ...data })));
    return () => socket.off('obs:update');
  }, []);

  // Transparence si rien à afficher
  const showTitrage = current.title || current.subtitle;

  return (
    <div className="obs-output-root" style={{
      width: 1920,
      height: 1080,
      position: 'fixed',
      top: 0,
      left: 0,
      background: showTitrage ? 'none' : 'none',
      zIndex: 99999,
      overflow: 'hidden',
    }}>
      {showTitrage && <LowerThird title={current.title} subtitle={current.subtitle} />}
    </div>
  );
}
