import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMediaForTopic } from '../services/api';

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function CustomMediaList({ programId: propProgramId, episodeId: propEpisodeId, topicId: propTopicId, topicTitle, programLogo }) {
  const params = useParams();
  const programId = propProgramId || params.programId;
  const episodeId = propEpisodeId || params.episodeId;
  const topicId = propTopicId || params.topicId;

  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMedia() {
      if (!programId || !episodeId || !topicId) return;
      try {
        setLoading(true);
        const response = await getMediaForTopic(programId, episodeId, topicId);
        setMediaItems(response.data);
        setError(null);
      } catch (err) {
        setError('Impossible de charger les médias.');
      } finally {
        setLoading(false);
      }
    }
    loadMedia();
  }, [programId, episodeId, topicId]);

  if (!programId || !episodeId || !topicId) {
    return <div>IDs manquants pour afficher les médias.</div>;
  }
  if (loading) {
    return <div>Chargement des médias...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }
  if (!mediaItems.length) {
    return <div>Aucun média pour ce sujet.</div>;
  }

  // Handler pour envoyer le média à OBS
  const handleCast = (media) => {
    // TODO: envoyer via WebSocket à OBS
    // Exemple: sendToOBS({ title: topicTitle, media, logoUrl: programLogo })
    alert(`Cast média: ${media.type}`);
  };
  // Handler pour envoyer le titrage à OBS
  const handleTitrage = () => {
    // TODO: envoyer via WebSocket à OBS
    // Exemple: sendToOBS({ title: topicTitle, media: null, logoUrl: programLogo })
    alert(`Titrage: ${topicTitle}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Médias du sujet "{topicTitle}"</h2>
        <button onClick={handleTitrage} style={{ marginLeft: 10, background: '#388e3c', color: 'white', border: 'none', borderRadius: 4, padding: '8px 12px', fontWeight: 600 }}>Titrage</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {mediaItems.map((media) => (
          <li key={media.id} style={{ marginBottom: '20px', background: '#222', padding: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {(() => {
                switch (media.type) {
                  case 'image':
                    return <img src={media.content} alt={`Média ${media.id}`} style={{ maxWidth: '320px', maxHeight: '200px', display: 'block', margin: '8px 0' }} />;
                  case 'video': {
                    const videoId = getYouTubeId(media.content);
                    if (videoId) {
                      return <iframe width="320" height="180" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{marginTop: '8px'}}></iframe>;
                    } else {
                      return <a href={media.content} target="_blank" rel="noopener noreferrer">Voir la vidéo (lien externe)</a>;
                    }
                  }
                  case 'audio':
                    return <a href={media.content} target="_blank" rel="noopener noreferrer">Écouter l'audio</a>;
                  case 'link':
                    return <a href={media.content} target="_blank" rel="noopener noreferrer">{media.content}</a>;
                  case 'url': {
                    const url = media.content;
                    if (/\.(jpg|jpeg|png|gif)$/i.test(url)) {
                      return <img src={url} alt="media" style={{ maxWidth: '320px', maxHeight: '200px', display: 'block', margin: '8px 0' }} />;
                    } else {
                      const videoId = getYouTubeId(url);
                      if (videoId) {
                        return <iframe width="320" height="180" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{marginTop: '8px'}}></iframe>;
                      } else {
                        return <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'#6cf',textDecoration:'underline'}}>Voir le média</a>;
                      }
                    }
                  }
                  case 'text':
                  default:
                    return <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{media.content}</p>;
                }
              })()}
            </div>
            <button onClick={() => handleCast(media)} style={{ marginLeft: 18, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, padding: '8px 12px', fontWeight: 600 }}>Cast</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomMediaList;
