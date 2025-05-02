/**
 * Modal d'aide montrant les raccourcis clavier et autres informations.
 * @module components/HelpModal
 */

import React from 'react';
import Modal from './Modal';
import { useKeyBindings } from './KeyBindingsContext';

/**
 * HelpModal affiche les raccourcis clavier et autres informations d'aide.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Callback de fermeture
 */
export default function HelpModal({ isOpen, onClose }) {
  const { keyBindings, resetKeyBindings } = useKeyBindings();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aide"
      size="md"
    >
      <div className="help-content">
        <section>
          <h3>Raccourcis clavier</h3>
          <table className="shortcuts-table">
            <tbody>
              <tr>
                <td><kbd>{keyBindings.nextTopic}</kbd></td>
                <td>Sujet suivant</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.previousTopic}</kbd></td>
                <td>Sujet précédent</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.nextMedia}</kbd></td>
                <td>Média suivant</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.previousMedia}</kbd></td>
                <td>Média précédent</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.playPause}</kbd></td>
                <td>Play/Pause média</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.titrage}</kbd></td>
                <td>Afficher/masquer titrage</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.fullscreen}</kbd></td>
                <td>Plein écran</td>
              </tr>
              <tr>
                <td><kbd>{keyBindings.toggleRegieMode}</kbd></td>
                <td>Mode régie</td>
              </tr>
            </tbody>
          </table>
          <button 
            onClick={resetKeyBindings}
            className="reset-shortcuts"
          >
            Réinitialiser les raccourcis
          </button>
        </section>

        <section>
          <h3>Fenêtres OBS</h3>
          <p>
            Les fenêtres OBS peuvent être ouvertes en trois modes :
          </p>
          <ul>
            <li><strong>Titrage + média</strong> : Affichage complet</li>
            <li><strong>Média seul</strong> : Uniquement les médias</li>
            <li><strong>Titrage seul</strong> : Uniquement le lower third</li>
          </ul>
          <p>
            Chaque fenêtre peut être ajoutée comme source navigateur dans OBS.
          </p>
        </section>

        <section>
          <h3>Support</h3>
          <p>
            Pour plus d'informations, consulter la documentation dans le dossier <code>/docs</code>.
          </p>
        </section>
      </div>
    </Modal>
  );
}