import React from 'react';
import Modal from './Modal';

export default function HelpModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ maxWidth: 600 }}>
        <h2 style={{ marginTop: 0, color: 'var(--text)', fontSize: 24, marginBottom: 32 }}>Aide & Raccourcis clavier</h2>
        
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 16, opacity: 0.9 }}>Navigation</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">H</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Retour à l'accueil</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">L</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Accéder aux paramètres</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">P</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Mode présentation</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">Échap</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Retour en arrière</span>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 16, opacity: 0.9 }}>Contrôle des médias</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">Espace</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Play/Pause du média actuel</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">→</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Média suivant</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">←</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Média précédent</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">T</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Lancer le titrage du sujet actuel</span>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 16, opacity: 0.9 }}>Autres</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">D</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Mode sombre</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
              <kbd className="shortcut-key">?</kbd>
              <span style={{ color: 'var(--text)', opacity: 0.8 }}>Afficher cette aide</span>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}