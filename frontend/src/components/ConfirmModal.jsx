import React from 'react';

export default function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-modal">
      <div className="modal-content">
        <div style={{marginBottom: '1.3em'}}>{message}</div>
        <button onClick={onConfirm} style={{background:'#2ecc40'}}>Oui</button>
        <button onClick={onCancel} style={{background:'#e74c3c'}}>Non</button>
      </div>
    </div>
  );
}
