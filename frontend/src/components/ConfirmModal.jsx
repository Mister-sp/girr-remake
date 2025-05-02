/**
 * Modal de confirmation avec actions personnalisables.
 * @module components/ConfirmModal
 */

import React from 'react';
import Modal from './Modal';

/**
 * ConfirmModal affiche une boîte de dialogue de confirmation.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {string} props.title - Titre du modal
 * @param {string} props.message - Message de confirmation
 * @param {string} [props.confirmText='Confirmer'] - Texte du bouton de confirmation
 * @param {string} [props.cancelText='Annuler'] - Texte du bouton d'annulation
 * @param {string} [props.confirmButtonClass=''] - Classe CSS du bouton de confirmation
 * @param {boolean} [props.isDangerous=false] - Si l'action est dangereuse (bouton rouge)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmButtonClass = '',
  isDangerous = false
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="confirm-modal-content">
        <p className="confirm-message">{message}</p>
        
        <div className="confirm-buttons">
          <button
            onClick={onClose}
            className="cancel-button"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            className={`confirm-button ${confirmButtonClass} ${isDangerous ? 'dangerous' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
