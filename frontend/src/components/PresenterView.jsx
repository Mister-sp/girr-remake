import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import ObsPreview from './ObsPreview';
import { useKeyBindings } from './KeyBindingsContext';
import { getEpisodeDetails, getTopicsForEpisode, getMediaForTopic } from '../services/api';
import { connectWebSocket } from '../services/websocket';

export default function PresenterView() {
  const { programId, episodeId } = useParams();
  const { keyBindings } = useKeyBindings();
  const [episode, setEpisode] = useState(null);
  const [topics, setTopics] = useState([]);
  const [mediaByTopic, setMediaByTopic] = useState({});
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRegieMode, setIsRegieMode] = useState(false);
  const [notes, setNotes] = useState({});

  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        const episodeRes = await getEpisodeDetails(programId, episodeId);
        setEpisode(episodeRes.data);
        
        const topicsRes = await getTopicsForEpisode(programId, episodeId);
        setTopics(topicsRes.data);

        const mediaObj = {};
        for (const topic of topicsRes.data) {
          const mediaRes = await getMediaForTopic(programId, episodeId, topic.id);
          mediaObj[topic.id] = mediaRes.data;
        }
        setMediaByTopic(mediaObj);

        // Initialiser les notes vides pour chaque sujet
        const initialNotes = {};
        topicsRes.data.forEach(topic => {
          initialNotes[topic.id] = '';
        });
        setNotes(initialNotes);
      } catch (err) {
        console.error('Erreur de chargement:', err);
      }
    }
    loadData();
  }, [programId, episodeId]);

  // Gestion du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Raccourcis clavier
  useHotkeys(keyBindings.playPause, () => {
    const currentTopic = topics[currentTopicIndex];
    if (!currentTopic) return;
    
    const mediaList = mediaByTopic[currentTopic.id] || [];
    if (currentMediaIndex >= 0) {
      // Arrêter le média actuel
      const socket = connectWebSocket();
      socket.emit('obs:update', { 
        title: '', 
        media: null,
        logoUrl: episode?.logo || null 
      });
      setCurrentMediaIndex(-1);
    } else if (mediaList.length > 0) {
      // Lancer le premier média
      const media = mediaList[0];
      handlePlay(currentTopic, media);
      setCurrentMediaIndex(0);
    }
  }, { preventDefault: true });

  useHotkeys(keyBindings.nextMedia, () => {
    const currentTopic = topics[currentTopicIndex];
    if (!currentTopic) return;

    const mediaList = mediaByTopic[currentTopic.id] || [];
    if (currentMediaIndex < mediaList.length - 1) {
      // Média suivant du même sujet
      const nextMedia = mediaList[currentMediaIndex + 1];
      setCurrentMediaIndex(currentMediaIndex + 1);
      handlePlay(currentTopic, nextMedia);
    } else if (currentTopicIndex < topics.length - 1) {
      // Premier média du sujet suivant
      const nextTopic = topics[currentTopicIndex + 1];
      const nextMediaList = mediaByTopic[nextTopic.id] || [];
      if (nextMediaList.length > 0) {
        setCurrentTopicIndex(currentTopicIndex + 1);
        setCurrentMediaIndex(0);
        handlePlay(nextTopic, nextMediaList[0]);
      }
    }
  }, { preventDefault: true });

  useHotkeys(keyBindings.previousMedia, () => {
    const currentTopic = topics[currentTopicIndex];
    if (!currentTopic) return;

    if (currentMediaIndex > 0) {
      // Média précédent du même sujet
      const prevMedia = mediaByTopic[currentTopic.id][currentMediaIndex - 1];
      setCurrentMediaIndex(currentMediaIndex - 1);
      handlePlay(currentTopic, prevMedia);
    } else if (currentTopicIndex > 0) {
      // Dernier média du sujet précédent
      const prevTopic = topics[currentTopicIndex - 1];
      const prevMediaList = mediaByTopic[prevTopic.id] || [];
      if (prevMediaList.length > 0) {
        setCurrentTopicIndex(currentTopicIndex - 1);
        setCurrentMediaIndex(prevMediaList.length - 1);
        handlePlay(prevTopic, prevMediaList[prevMediaList.length - 1]);
      }
    }
  }, { preventDefault: true });

  useHotkeys(keyBindings.titrage, () => {
    const currentTopic = topics[currentTopicIndex];
    if (!currentTopic) return;
    handleTitrage(currentTopic);
  }, { preventDefault: true });

  useHotkeys(keyBindings.fullscreen, toggleFullscreen, { preventDefault: true });

  useHotkeys(keyBindings.nextTopic, () => {
    if (currentTopicIndex < topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
      setCurrentMediaIndex(-1);
      const nextTopic = topics[currentTopicIndex + 1];
      handleTitrage(nextTopic);
    }
  }, { preventDefault: true });

  useHotkeys(keyBindings.previousTopic, () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(currentTopicIndex - 1);
      setCurrentMediaIndex(-1);
      const prevTopic = topics[currentTopicIndex - 1];
      handleTitrage(prevTopic);
    }
  }, { preventDefault: true });

  useHotkeys(keyBindings.toggleRegieMode, () => {
    setIsRegieMode(!isRegieMode);
  }, { preventDefault: true });

  // Gestion des médias
  const handlePlay = (topic, media) => {
    const socket = connectWebSocket();
    socket.emit('obs:update', {
      title: topic.title,
      media: {
        type: /\.(jpg|jpeg|png|gif|webp)$/i.test(media.content) ? 'image' : 
              /youtu(\.be|be\.com)/.test(media.content) ? 'youtube' : 'url',
        url: media.content
      },
      logoUrl: episode?.logo || null
    });
  };

  const handleTitrage = (topic) => {
    const socket = connectWebSocket();
    socket.emit('obs:update', {
      title: topic.title,
      media: null,
      logoUrl: episode?.logo || null
    });
  };

  const handleNoteChange = (topicId, newNote) => {
    setNotes(prev => ({
      ...prev,
      [topicId]: newNote
    }));
  };

  if (!episode || !topics.length) return null;

  const nextTopic = topics[currentTopicIndex + 1];
  const previousTopic = topics[currentTopicIndex - 1];

  return (
    <div className="presenter-view" style={{
      height: '100vh',
      display: 'grid',
      gridTemplateColumns: isRegieMode ? '1fr' : '1fr 384px',
      gridTemplateRows: '60px 1fr',
      gap: 2,
      background: '#111',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        gridColumn: '1 / -1',
        background: '#222',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <h1 style={{fontSize: 18, margin: 0}}>{episode.title}</h1>
          <div style={{ color: '#aaa', fontSize: 14 }}>
            Sujet {currentTopicIndex + 1}/{topics.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIsRegieMode(!isRegieMode)} style={{
            background: isRegieMode ? '#1976d2' : 'none',
            border: 'none',
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer'
          }}>
            Mode régie
          </button>
          <button onClick={toggleFullscreen} style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer'
          }}>
            {isFullscreen ? 'Quitter' : 'Plein écran'}
          </button>
        </div>
      </div>
      
      {isRegieMode ? (
        // Vue régie (grille)
        <div style={{
          padding: 24,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {topics.map((topic, topicIndex) => (
            <div key={topic.id} style={{
              background: currentTopicIndex === topicIndex ? '#2a2a2a' : '#1f1f1f',
              padding: 16,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <h3 style={{margin: 0, fontSize: 16}}>{topic.title}</h3>
                <button 
                  onClick={() => {
                    setCurrentTopicIndex(topicIndex);
                    handleTitrage(topic);
                    setIsRegieMode(false);
                  }}
                  style={{
                    background: '#444',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Sélectionner
                </button>
              </div>

              {topic.script && (
                <div style={{
                  background: '#333',
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 13,
                  maxHeight: 100,
                  overflowY: 'auto'
                }}>
                  {topic.script}
                </div>
              )}

              <textarea
                value={notes[topic.id] || ''}
                onChange={(e) => handleNoteChange(topic.id, e.target.value)}
                placeholder="Notes"
                style={{
                  background: '#333',
                  border: '1px solid #444',
                  borderRadius: 4,
                  padding: 8,
                  color: '#fff',
                  height: 80,
                  resize: 'none'
                }}
              />

              {/* Liste des médias avec aperçu */}
              {mediaByTopic[topic.id]?.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{fontSize: 13, color: '#aaa', marginTop: 4}}>Médias :</div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    {mediaByTopic[topic.id].map((media, mediaIndex) => (
                      <button
                        key={media.id}
                        onClick={() => {
                          setCurrentTopicIndex(topicIndex);
                          setCurrentMediaIndex(mediaIndex);
                          handlePlay(topic, media);
                        }}
                        style={{
                          background: currentTopicIndex === topicIndex && currentMediaIndex === mediaIndex ? '#1976d2' : '#333',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: '1 1 auto'
                        }}
                        title={media.content}
                      >
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(media.content) ? '🖼️' : 
                         /youtu(\.be|be\.com)/.test(media.content) ? '▶️' : '🔗'} 
                        {media.content.length > 30 ? media.content.substring(0, 27) + '...' : media.content}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                fontSize: 13,
                color: '#aaa',
                display: 'flex',
                gap: 8,
                marginTop: 'auto',
                paddingTop: 8,
                borderTop: '1px solid #333'
              }}>
                <span>{mediaByTopic[topic.id]?.length || 0} médias</span>
                {currentTopicIndex === topicIndex && (
                  <span style={{color: '#4CAF50'}}>• Actif</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Liste des sujets et médias */}
          <div style={{
            background: '#181818',
            padding: 24,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            {/* Section Previous Topic */}
            {previousTopic && (
              <div style={{
                background: '#1f1f1f',
                padding: 16,
                borderRadius: 8,
                opacity: 0.6
              }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>Précédent :</div>
                <h4 style={{ margin: 0 }}>{previousTopic.title}</h4>
              </div>
            )}

            {/* Current Topic */}
            <div style={{
              background: '#2a2a2a',
              padding: 16,
              borderRadius: 8,
              flex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12
              }}>
                <h3 style={{margin: 0, flex: 1}}>{topics[currentTopicIndex].title}</h3>
                <button 
                  onClick={() => handleTitrage(topics[currentTopicIndex])}
                  style={{
                    background: '#444',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Titrage
                </button>
              </div>

              {topics[currentTopicIndex].script && (
                <div style={{
                  background: '#333',
                  padding: 12,
                  borderRadius: 4,
                  marginBottom: 12,
                  fontSize: 14,
                  whiteSpace: 'pre-wrap'
                }}>
                  {topics[currentTopicIndex].script}
                </div>
              )}

              <textarea
                value={notes[topics[currentTopicIndex].id] || ''}
                onChange={(e) => handleNoteChange(topics[currentTopicIndex].id, e.target.value)}
                placeholder="Notes pour ce sujet..."
                style={{
                  width: '100%',
                  background: '#333',
                  border: '1px solid #444',
                  borderRadius: 4,
                  padding: 12,
                  color: '#fff',
                  minHeight: 100,
                  marginBottom: 16,
                  resize: 'vertical'
                }}
              />

              {mediaByTopic[topics[currentTopicIndex].id]?.map((media, mediaIndex) => (
                <div
                  key={media.id}
                  onClick={() => {
                    setCurrentMediaIndex(mediaIndex);
                    handlePlay(topics[currentTopicIndex], media);
                  }}
                  style={{
                    padding: 12,
                    background: currentMediaIndex === mediaIndex ? '#444' : '#2a2a2a',
                    marginTop: 8,
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {media.content}
                </div>
              ))}
            </div>

            {/* Section Next Topic */}
            {nextTopic && (
              <div style={{
                background: '#1f1f1f',
                padding: 16,
                borderRadius: 8,
                opacity: 0.6
              }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>Suivant :</div>
                <h4 style={{ margin: 0 }}>{nextTopic.title}</h4>
                <div style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>
                  {mediaByTopic[nextTopic.id]?.length || 0} médias
                </div>
              </div>
            )}
          </div>

          {/* Preview OBS et raccourcis */}
          <div style={{
            background: '#181818',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <ObsPreview width={352} height={198} />
            <div style={{fontSize: 13, color: '#aaa'}}>
              <div>Raccourcis :</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                <div>{keyBindings.playPause} : Play/Pause</div>
                <div>{keyBindings.previousMedia}/{keyBindings.nextMedia} : Navigation médias</div>
                <div>{keyBindings.previousTopic}/{keyBindings.nextTopic} : Navigation sujets</div>
                <div>{keyBindings.titrage} : Titrage</div>
                <div>{keyBindings.fullscreen} : Plein écran</div>
                <div>{keyBindings.toggleRegieMode} : Mode régie</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}