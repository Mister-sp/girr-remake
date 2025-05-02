/**
 * Composant Modal réutilisable avec gestion de l'accessibilité.
 * @module components/Modal
 */

import React, { useEffect, useCallback } from 'react';
import { usePerformance } from './PerformanceProvider';

/**
 * Modal accessible avec support du focus trap et fermeture par Escape.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Callback de fermeture
 * @param {React.ReactNode} props.children - Contenu du modal
 * @param {string} [props.title] - Titre du modal pour l'accessibilité
 * @param {string} [props.size='md'] - Taille du modal ('sm', 'md', 'lg')
 * @param {boolean} [props.closeOnOverlayClick=true] - Fermer en cliquant sur l'overlay
 * @param {boolean} [props.showCloseButton=true] - Afficher le bouton de fermeture
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true
}) {
  const { reducedMotion } = usePerformance();

  // Gestion du focus trap
  const handleTabKey = useCallback((e) => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  }, []);

  // Gestion de la touche Escape
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Ajouter/retirer les event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleTabKey, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div 
      className={`modal-overlay ${reducedMotion ? '' : 'fade-in'}`}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`modal-content modal-${size} ${reducedMotion ? '' : 'slide-in'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
        )}
        {showCloseButton && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
