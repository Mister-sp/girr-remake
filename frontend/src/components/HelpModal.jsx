import React from 'react';
import Modal from './Modal';

export default function HelpModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ maxWidth: 600 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>Raccourcis clavier</h2>
        
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: '#222', marginBottom: 16 }}>Navigation</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>H</kbd>
              <span>Retour à l'accueil</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>L</kbd>
              <span>Mode contrôle live</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>Échap</kbd>
              <span>Retour en arrière</span>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: '#222', marginBottom: 16 }}>Contrôle des médias</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>Espace</kbd>
              <span>Play/Pause du média actuel</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>→</kbd>
              <span>Média suivant</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>←</kbd>
              <span>Média précédent</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>T</kbd>
              <span>Lancer le titrage du sujet actuel</span>
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: 18, color: '#222', marginBottom: 16 }}>Autres</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>Shift + N</kbd>
              <span>Nouveau programme/épisode/sujet</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>Shift + P</kbd>
              <span>Ouvrir la preview</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <kbd style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>?</kbd>
              <span>Afficher cette aide</span>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}