import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEpisodeDetails, getTopicsForEpisode, getMediaForTopic, updateTopic, deleteTopic, createMedia, createTopic } from '../services/api';
import CustomMediaList from './CustomMediaList.jsx';
import EditTopicModal from './EditTopicModal';
import { FaPencilAlt, FaPlay, FaChevronUp, FaChevronDown, FaPlus, FaPause } from 'react-icons/fa';
import { MdCast, MdCastConnected } from 'react-icons/md';

function EpisodeFullView() {
  const { programId, episodeId } = useParams();
  const [episode, setEpisode] = useState(null);
  const [topics, setTopics] = useState([]);
  const [mediaByTopic, setMediaByTopic] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Ajouts pour UI et gestion sujets ---
  const [editTopic, setEditTopic] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const episodeRes = await getEpisodeDetails(programId, episodeId);
        console.log('DEBUG episodeRes.data', episodeRes.data);
        setEpisode(episodeRes.data);
        const topicsRes = await getTopicsForEpisode(programId, episodeId);
        console.log('DEBUG topicsRes.data', topicsRes.data);
        setTopics(topicsRes.data);
        const mediaObj = {};
        for (const topic of topicsRes.data) {
          const mediaRes = await getMediaForTopic(programId, episodeId, topic.id);
          mediaObj[topic.id] = mediaRes.data;
        }
        setMediaByTopic(mediaObj);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les données de l'épisode.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [programId, episodeId]);

  const reloadAll = async () => {
    setLoading(true);
    try {
      const topicsRes = await getTopicsForEpisode(programId, episodeId);
      setTopics(topicsRes.data);
      const mediaObj = {};
      for (const topic of topicsRes.data) {
        const mediaRes = await getMediaForTopic(programId, episodeId, topic.id);
        mediaObj[topic.id] = mediaRes.data;
      }
      setMediaByTopic(mediaObj);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topic) => {
    console.log('handleEdit appelé', topic);
    setEditTopic(topic);
  };
  const handleCloseEdit = () => setEditTopic(null);
  const handleUpdateTopic = async (updated) => {
    await updateTopic(programId, episodeId, updated.id, updated);
    await reloadAll();
  };
  const handleDeleteTopic = async () => {
    if (!editTopic) return;
    await deleteTopic(programId, episodeId, editTopic.id);
    setEditTopic(null);
    await reloadAll();
  };
  const handleAddMedia = async (mediaUrl) => {
    if (!editTopic) return;
    await createMedia(programId, episodeId, editTopic.id, { type: 'url', content: mediaUrl });
    await reloadAll();
  };
  const handlePlay = (topic) => {
    // Envoie le titre du sujet et le logo du programme à la page OBS via WebSocket
    import('../services/websocket').then(({ connectWebSocket }) => {
      const socket = connectWebSocket();
      socket.emit('obs:update', { title: topic.title, media: null, logoUrl: episode && (episode.logo || episode.programLogo || null) });
    });
  };


  const toggleExpand = (topicId) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };
  // Pour mémoriser le dernier topic ajouté (id à ouvrir)
  const [pendingOpenTopicId, setPendingOpenTopicId] = useState(null);

  // État pour titrage/cast actif
  const [titrageActif, setTitrageActif] = useState(null); // topicId
  const [castActif, setCastActif] = useState(null); // mediaId

  // Handler titrage OBS
  const handleTitrage = (topic) => {
    setTitrageActif(topic.id);
    setCastActif(null); // désactive tout cast
    import('../services/websocket').then(({ connectWebSocket }) => {
      const socket = connectWebSocket();
      socket.emit('obs:update', {
        title: topic.title,
        media: null,
        logoUrl: episode && (episode.logo || episode.programLogo || null),
      });
    });
  };
  // Handler cast OBS
  function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
  }
  const handleCast = (topic, media) => {
    setCastActif(media.id);
    setTitrageActif(null); // désactive titrage
    import('../services/websocket').then(({ connectWebSocket }) => {
      const socket = connectWebSocket();
      let type = media.type;
      let url = media.content;
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
        type = 'image';
      } else if (isYouTubeUrl(url)) {
        type = 'youtube';
      }
      socket.emit('obs:update', {
        title: topic.title,
        media: { type, url },
        logoUrl: episode && (episode.logo || episode.programLogo || null),
      });
    });
  };




  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const res = await createTopic(programId, episodeId, { title: newTopicTitle });
    setNewTopicTitle('');
    setAddMode(false);
    let newId = null;
    if (res && res.data && (res.data.id || res.data._id)) {
      newId = res.data.id || res.data._id;
    }
    // On recharge la liste, puis on ouvrira la modale via useEffect
    setPendingOpenTopicId(newId);
    await reloadAll();
  };

  // Effet pour ouvrir la modale d'édition du nouveau topic après reload
  useEffect(() => {
    if (pendingOpenTopicId && topics && topics.length > 0) {
      const topic = topics.find(t => t.id === pendingOpenTopicId || t._id === pendingOpenTopicId);
      if (topic) {
        setEditTopic(topic);
        setPendingOpenTopicId(null);
      }
    }
  }, [pendingOpenTopicId, topics]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!episode || typeof episode !== 'object' || episode instanceof Response) return <div>Erreur de chargement des données épisode (type inattendu).</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, position: 'relative' }}>
      <h2>Épisode {episode.title}</h2>

      <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <strong>{episode.title}</strong>
        <div style={{ marginTop: 8 }}>{episode.description}</div>
      </div>
      {/* Bouton flottant + en bas à droite */}
      <button
        onClick={() => setAddMode((v) => !v)}
        className="floating-add-btn"
        title="Ajouter un sujet"
      >
        <span className="plus-icon" />
      </button>
      <style>{`
        .floating-add-btn {
          position: fixed;
          top: 32px;
          right: 32px;
          z-index: 1000;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          box-shadow: 0 4px 16px #0006;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          background: var(--primary);
        }
        .plus-icon {
          display: block;
          width: 36px;
          height: 36px;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>') no-repeat center;
        }
      `}</style>
      {editTopic && (
        <EditTopicModal
          open={true}
          topic={editTopic}
          onClose={handleCloseEdit}
          onUpdate={handleUpdateTopic}
          onDelete={handleDeleteTopic}
          onAddMedia={handleAddMedia}
          mediaItems={mediaByTopic[editTopic?.id] || []}
        />
      )}
      {addMode && (
        <form onSubmit={handleAddTopic} style={{ position: 'fixed', bottom: 80, right: 80, background: '#181a1b', padding: 16, borderRadius: 8, boxShadow: '0 4px 16px #0006' }}>
          <input
            type="text"
            value={newTopicTitle}
            onChange={e => setNewTopicTitle(e.target.value)}
            placeholder="Titre du sujet"
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #444', background: '#181a1b', color: '#fff' }}
            autoFocus
          />
          <button type="submit" style={{ background: '#388e3c', color: 'white', border: 'none', borderRadius: 4, padding: '8px 12px', fontWeight: 600 }}>Ajouter</button>
        </form>
      )}

      {topics.map(topic => (
        <div key={topic.id} style={{ marginBottom: 32, background: '#181a1b', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0, flex: 1 }}>{topic.title}</h3>
             <button onClick={e => { e.stopPropagation(); handleEdit(topic); }} title="Modifier"><FaPencilAlt /></button>
            <button onClick={() => toggleExpand(topic.id)} title={expandedTopics[topic.id] ? 'Réduire' : 'Déplier'}>
              {expandedTopics[topic.id] ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          {/* Affichage du script du sujet */}
          {topic.script && (
            <div style={{ background: '#222', color: '#fff', borderRadius: 4, padding: 10, margin: '12px 0', fontSize: 15, whiteSpace: 'pre-line' }}>
              {topic.script}
            </div>
          )}
          {expandedTopics[topic.id] !== false && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                 <button onClick={() => {
                   if (titrageActif === topic.id) {
                     setTitrageActif(null);
                     import('../services/websocket').then(({ connectWebSocket }) => {
                       const socket = connectWebSocket();
                       socket.emit('obs:update', { title: '', media: null, logoUrl: episode && (episode.logo || episode.programLogo || null) });
                     });
                   } else {
                     handleTitrage(topic);
                   }
                 }} style={{ background: titrageActif === topic.id ? '#1976d2' : '#388e3c', color: 'white', border: 'none', borderRadius: 4, padding: '8px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: 20 }}>
                   {titrageActif === topic.id ? <FaPause /> : <FaPlay />}<span style={{marginLeft:8,fontSize:15}}>Titrage</span>
                 </button>
              </div>
              {mediaByTopic[topic.id] && mediaByTopic[topic.id].length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {mediaByTopic[topic.id].map(media => (
                    <li key={media.id} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <MediaPreview url={media.content} type={media.type} />
                      </div>
                      <button onClick={() => {
                    if (castActif === media.id) {
                      setCastActif(null);
                      import('../services/websocket').then(({ connectWebSocket }) => {
                        const socket = connectWebSocket();
                        socket.emit('obs:update', { title: '', media: null, logoUrl: episode && (episode.logo || episode.programLogo || null) });
                      });
                    } else {
                      handleCast(topic, media);
                    }
                  }} style={{ marginLeft: 18, background: castActif === media.id ? '#388e3c' : '#222', color: castActif === media.id ? '#fff' : '#90caf9', border: 'none', borderRadius: 4, padding: '8px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: 22 }}>
                    {castActif === media.id ? <MdCastConnected /> : <MdCast />}
                  </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: '#aaa' }}>Aucun média pour ce sujet.</div>
              )}
            </div>
          )}
        </div>
      ))}
      {/* Affichage des médias du sujet sélectionné si topicId présent */}


    </div>
  );
}


// Aperçu média intelligent (image, YouTube, lien)
function MediaPreview({ url, type }) {
  if (!url) return null;
  // Image
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="media" style={{ maxWidth: 320, maxHeight: 180, borderRadius: 6, boxShadow: '0 2px 8px #0006' }} />
      </a>
    );
  }
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, maxWidth: 400 }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="YouTube preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        />
      </div>
    );
  }
  // Lien générique
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9', wordBreak: 'break-all' }}>{url} <span style={{ color: '#aaa' }}>(url)</span></a>
  );
}

export default EpisodeFullView;
