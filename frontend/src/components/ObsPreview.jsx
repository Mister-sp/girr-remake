import React, { useState, useEffect } from 'react';
import { connectWebSocket } from '../services/websocket';
import ObsOutput from './ObsOutput';

/**
 * Affiche une prévisualisation fidèle du rendu OBS dans un conteneur à ratio fixe (16:9).
 * Props:
 *   - width: largeur du preview (ex: 384)
 *   - height: hauteur du preview (ex: 216)
 *   - ...props: toutes les props passées à ObsOutput
 */
export default function ObsPreview({ width = 384, height = 216, ...props }) {
  // Calcul responsive de la taille du preview
  const [previewSize, setPreviewSize] = React.useState({ width, height });
  
  React.useEffect(() => {
    function updatePreviewSize() {
      const container = document.querySelector('#root');
      if (!container) return;
      
      const maxWidth = container.clientWidth - 32; // Marge de 16px de chaque côté
      const maxHeight = window.innerHeight * 0.4; // Max 40% de la hauteur de l'écran
      
      // Garde le ratio 16:9
      const ratio = 16/9;
      let newWidth = Math.min(maxWidth, width);
      let newHeight = newWidth / ratio;
      
      // Si la hauteur dépasse, on recalcule depuis la hauteur
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * ratio;
      }
      
      setPreviewSize({ width: newWidth, height: newHeight });
    }
    
    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, [width, height]);

  // État pour stocker les données de preview
  const [previewData, setPreviewData] = useState({
    title: '',
    subtitle: '',
    logoUrl: null,
    logoEffect: 'none',
    logoPosition: 'top-right',
    logoSize: 80,
    media: null,
    lowerThirdConfig: null
  });

  // Connexion WebSocket pour recevoir les mises à jour
  useEffect(() => {
    const socket = connectWebSocket();

    const handleUpdate = (data) => {
      console.log('[Preview] Reçu obs:update', data);
      setPreviewData(prev => ({
        ...prev,
        title: data.title ?? prev.title,
        subtitle: data.subtitle ?? prev.subtitle,
        logoUrl: data.logoUrl ?? prev.logoUrl,
        logoEffect: data.logoEffect ?? prev.logoEffect,
        logoPosition: data.logoPosition ?? prev.logoPosition,
        logoSize: data.logoSize ?? prev.logoSize,
        // Si data.media est undefined/null, on doit explicitement le mettre à null pour cacher le média
        media: data.media !== undefined ? data.media : null,
        lowerThirdConfig: data.lowerThirdConfig ?? prev.lowerThirdConfig
      }));
    };

    socket.on('obs:update', handleUpdate);
    
    // S'enregistrer comme client de prévisualisation
    socket.emit('register', { 
      pathname: window.location.pathname,
      type: 'control-preview'
    });

    return () => {
      socket.off('obs:update', handleUpdate);
    };
  }, []);

  // Ratio cible (1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;

  // Calcul de l'échelle pour maintenir le ratio 16:9
  const containerRatio = previewSize.width / previewSize.height;
  const targetRatio = baseWidth / baseHeight; 
  const scale = containerRatio > targetRatio 
    ? previewSize.height / baseHeight
    : previewSize.width / baseWidth;

  // On s'assure que les props.current contiennent bien la valeur media=null si pas de média
  const mergedProps = {
    ...props,
    current: {
      ...previewData,
      ...(props.current || {}),
      // On force media à null si pas de média dans les props
      media: props.current?.media !== undefined ? props.current.media : previewData.media
    }
  };

  return (
    <div
      style={{
        width: previewSize.width,
        height: previewSize.height,
        backgroundColor: '#000',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -(baseHeight / 2),
          marginLeft: -(baseWidth / 2),
        }}
      >
        <ObsOutput 
          previewMode 
          {...mergedProps}
          scale={1}
        />
      </div>
    </div>
  );
}
