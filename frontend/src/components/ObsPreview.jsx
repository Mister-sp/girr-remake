import React from 'react';
import ObsOutput from './ObsOutput';

/**
 * Affiche une prévisualisation fidèle du rendu OBS dans un conteneur à ratio fixe (16:9).
 * Props:
 *   - width: largeur du preview (ex: 384)
 *   - height: hauteur du preview (ex: 216)
 *   - ...props: toutes les props passées à ObsOutput
 */
export default function ObsPreview({ width = 384, height = 216, ...props }) {
  // Ratio cible (ex: 1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  return (
    <div
      style={{
        width,
        height,
        background: '#222',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 16px #000a',
        position: 'relative',
        border: '2px solid #fff',
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
          transformOrigin: 'top left',
          pointerEvents: 'none', // Pour éviter les clics dans le preview
        }}
      >
        <ObsOutput previewMode {...props} />
      </div>
    </div>
  );
}
