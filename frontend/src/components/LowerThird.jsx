/**
 * Composant de lower third (titrage) pour OBS.
 * @module components/LowerThird
 */

import React, { useEffect } from 'react';
import './logo-effects.css';

/**
 * Affiche un lower third animé avec support de logo.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre principal
 * @param {string} [props.subtitle] - Sous-titre
 * @param {string} [props.logoUrl] - URL du logo
 * @param {string} [props.transitionIn='fade'] - Animation d'entrée
 * @param {string} [props.transitionOut='fade'] - Animation de sortie
 * @param {string} [props.fontFamily='Inter'] - Police de caractères
 * @param {string} [props.fontUrl] - URL de la police (Google Fonts)
 * @param {number} [props.fontSize=32] - Taille de la police
 * @param {string} [props.fontWeight='bold'] - Graisse de la police
 * @param {string} [props.textColor='#FFFFFF'] - Couleur du texte
 * @param {string} [props.backgroundColor='#181818'] - Couleur de fond
 * @param {number} [props.backgroundOpacity=0.97] - Opacité du fond
 * @param {boolean} [props.logoInLowerThird=false] - Afficher le logo dans le lower third
 * @param {string} [props.logoPosition='left'] - Position du logo ('left', 'right')
 */
export default function LowerThird({
  title,
  subtitle,
  logoUrl,
  transitionIn = 'fade',
  transitionOut = 'fade',
  fontFamily = 'Inter',
  fontUrl,
  fontSize = 32,
  fontWeight = 'bold',
  textColor = '#FFFFFF',
  backgroundColor = '#181818',
  backgroundOpacity = 0.97,
  logoInLowerThird = false,
  logoPosition = 'left'
}) {
  // Charger la police Google Fonts si spécifiée
  useEffect(() => {
    if (fontUrl) {
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [fontUrl]);

  // Calculer les classes CSS pour les transitions
  const transitionClass = `transition-${transitionIn}-in transition-${transitionOut}-out`;

  return (
    <div 
      className={`lower-third ${transitionClass}`}
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color: textColor,
        '--bg-color': backgroundColor,
        '--bg-opacity': backgroundOpacity
      }}
    >
      {/* Conteneur du logo */}
      {logoInLowerThird && logoUrl && (
        <div 
          className={`lower-third-logo ${logoPosition}`}
          style={{
            backgroundImage: `url(${
              logoUrl.startsWith('http') ? logoUrl : `http://localhost:3001${logoUrl}`
            })`
          }}
        />
      )}

      {/* Conteneur du texte */}
      <div className="lower-third-text">
        <div className="title">{title}</div>
        {subtitle && (
          <div className="subtitle">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
