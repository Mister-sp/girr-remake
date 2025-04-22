import React, { useState, useEffect } from 'react';

// Composant d'aperçu média (image, YouTube, lien)
function MediaPreview({ url }) {
  if (!url) return null;
  const isImage = /\.(jpeg|jpg|png|gif|webp|bmp)$/i.test(url);
  const isYoutube = /(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/.exec(url);
  if (isImage) {
    return <img src={url} alt="aperçu" style={{ maxWidth: 80, maxHeight: 60, borderRadius: 4, background: '#222' }} />;
  }
  if (isYoutube) {
    return (
      <iframe
        width="90"
        height="60"
        src={`https://www.youtube.com/embed/${isYoutube[1]}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Aperçu vidéo"
        style={{ borderRadius: 4, background: '#222' }}
      />
    );
  }
  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#FFD166', fontSize: 13 }}>{url}</a>;
}


function EditTopicModal({
  open, onClose, topic, onUpdate, onDelete, onAddMedia, mediaItems = [], onUpdateMedia, onDeleteMedia
}) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState(topic.title || '');
  const [script, setScript] = useState(topic.script || '');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Synchronise le formulaire avec le sujet à éditer
  useEffect(() => {
    setTitle(topic.title || '');
    setScript(topic.script || '');
  }, [topic]);

  if (!open) return null;

  const handleUpdate = async () => {
    setSaving(true);
    await onUpdate({ ...topic, title, script });
    setSaving(false);
    onClose();
  };

  const handleAddMedia = async () => {
    if (!mediaUrl.trim()) return;
    setSaving(true);
    await onAddMedia(mediaUrl);
    setMediaUrl('');
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Modifier le sujet</h2>
        <label style={{ marginTop: 12 }}>Titre</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
          autoFocus
        />
        <label>Script</label>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          style={{ width: '100%', minHeight: 90, marginBottom: 12 }}
        />
        {/* Liste des médias existants */}
        {mediaItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label>Médias existants</label>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {mediaItems.map(media => {
                return (
                  <li key={media.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <MediaPreview url={media.content} type={media.type} />
                      </div>
                      <button
                        onClick={() => setEditingId(media.id)}
                        style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginRight: 4 }}
                      >Modifier</button>
                      <button
                        onClick={() => onDeleteMedia && onDeleteMedia(media.id)}
                        style={{ background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }}
                      >Supprimer</button>
                    </div>
                    {editingId === media.id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 30 }}>
                        <input
                          type="text"
                          defaultValue={media.content}
                          style={{ flex: 1, background: '#181a1b', color: '#fff', border: '1px solid #444', borderRadius: 4, padding: 6 }}
                          onBlur={e => {
                            if (e.target.value !== media.content && onUpdateMedia) onUpdateMedia(media.id, e.target.value);
                            setEditingId(null);
                          }}
                          autoFocus
                        />
                        <button onClick={() => setEditingId(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }}>Annuler</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <label>Ajouter un média (URL)</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
            placeholder="https://..."
            style={{ flex: 1 }}
          />
          <button onClick={handleAddMedia} disabled={saving || !mediaUrl.trim()}>Ajouter</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button onClick={onDelete} style={{ color: 'white', background: '#b71c1c' }}>Supprimer</button>
          <div>
            <button onClick={onClose} style={{ marginRight: 8 }}>Annuler</button>
            <button onClick={handleUpdate} disabled={saving} style={{ background: '#880e4f', color: 'white' }}>Mettre à jour</button>
          </div>
        </div>
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

export default EditTopicModal;
