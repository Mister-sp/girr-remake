import React, { useState, useEffect } from 'react';

/**
 * Modal pour créer ou éditer un sujet.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onSave - Callback après sauvegarde
 * @param {Object} [props.topic] - Sujet à éditer (undefined pour création)
 * @param {number} props.programId - ID du programme parent
 * @param {number} props.episodeId - ID de l'épisode parent
 */
export default function EditTopicModal({
  isOpen,
  onClose,
  onSave,
  topic,
  programId,
  episodeId
}) {
  const [formData, setFormData] = useState({
    title: '',
    script: '',
    duration: 0
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser le formulaire avec les données du sujet
  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title || '',
        script: topic.script || '',
        duration: topic.duration || 0
      });
    } else {
      setFormData({
        title: '',
        script: '',
        duration: 0
      });
    }
  }, [topic, isOpen]);

  /**
   * Met à jour le formulaire avec debounce.
   * @param {string} field - Champ à mettre à jour
   * @param {string|number} value - Nouvelle valeur
   */
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Sauvegarde le sujet.
   * @param {Event} e - Event submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      if (topic) {
        // Mode édition
        await updateTopic(programId, episodeId, topic.id, formData);
      } else {
        // Mode création
        await createTopic(programId, episodeId, formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{topic ? 'Modifier le sujet' : 'Nouveau sujet'}</h2>
        <form onSubmit={handleSubmit} className="topic-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              required
              maxLength={100}
              placeholder="Titre du sujet"
            />
          </div>

          <div className="form-group">
            <label htmlFor="script">Script/Notes</label>
            <textarea
              id="script"
              value={formData.script}
              onChange={e => handleFieldChange('script', e.target.value)}
              rows={5}
              placeholder="Notes ou script du sujet"
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">
              Durée (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={formData.duration}
              onChange={e => handleFieldChange('duration', parseInt(e.target.value) || 0)}
              min={0}
              max={180}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSaving || !formData.title.trim()}
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000;
        }
        .modal-card {
          background: #222; color: #fff; border-radius: 8px; max-width: 500px; width: 100%; padding: 28px 24px; box-shadow: 0 8px 32px #0008;
        }
        .modal-card input, .modal-card textarea {
          background: #181a1b; color: #fff; border: 1px solid #444; border-radius: 4px; padding: 8px;
        }
        .modal-card button { border:none; border-radius:4px; padding:8px 18px; font-weight:600; cursor:pointer; }
        .modal-card button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
