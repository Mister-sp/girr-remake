import { useState } from 'react';
import './modern-ui.css';
import './toasts-and-modal.css';
import { ToastProvider } from './components/ToastProvider.jsx';
import { FaFilm, FaListUl, FaBookOpen, FaArrowLeft, FaMoon, FaSun } from './components/Icons';
import { useEffect, useState as useReactState } from 'react';
import ProgramList from './components/ProgramList';
import EpisodeList from './components/EpisodeList'; 
import TopicList from './components/TopicList';
import MediaList from './components/MediaList'; 

function App() {
  // Dark mode state & logic
  const [darkMode, setDarkMode] = useReactState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    // Use system preference by default
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  // États pour la navigation Programme -> Épisode -> Sujet -> Média
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedProgramTitle, setSelectedProgramTitle] = useState('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null); 
  const [selectedEpisodeTitle, setSelectedEpisodeTitle] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(null); 
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(''); 

  // Sélection d'un programme
  const handleSelectProgram = (programId, programTitle) => {
    setSelectedProgramId(programId);
    setSelectedProgramTitle(programTitle);
    setSelectedEpisodeId(null);
    setSelectedEpisodeTitle('');
    setSelectedTopicId(null); 
    setSelectedTopicTitle('');
  };

  // Sélection d'un épisode
  const handleSelectEpisode = (episodeId, episodeTitle) => {
    setSelectedEpisodeId(episodeId);
    setSelectedEpisodeTitle(episodeTitle);
    setSelectedTopicId(null); 
    setSelectedTopicTitle('');
  };

  // Sélection d'un sujet (à passer à TopicList)
  const handleSelectTopic = (topicId, topicTitle) => {
    setSelectedTopicId(topicId);
    setSelectedTopicTitle(topicTitle);
  };

  // Retour à la liste des programmes
  const handleBackToPrograms = () => {
    setSelectedProgramId(null);
    setSelectedProgramTitle('');
    setSelectedEpisodeId(null); 
    setSelectedEpisodeTitle('');
    setSelectedTopicId(null);
    setSelectedTopicTitle('');
  };

  // Retour à la liste des épisodes
  const handleBackToEpisodes = () => {
    setSelectedEpisodeId(null);
    setSelectedEpisodeTitle('');
    setSelectedTopicId(null); 
    setSelectedTopicTitle('');
  };

  // Retour à la liste des sujets (depuis MediaList)
  const handleBackToTopics = () => {
    setSelectedTopicId(null);
    setSelectedTopicTitle('');
  };


  // Logique d'affichage conditionnel
  let content;
  if (selectedProgramId === null) {
    // Vue 1: Programmes
    content = <ProgramList onSelectProgram={handleSelectProgram} />;
  } else if (selectedEpisodeId === null) {
    // Vue 2: Épisodes
    content = (
      <EpisodeList 
        programId={selectedProgramId} 
        programTitle={selectedProgramTitle} 
        onSelectEpisode={handleSelectEpisode} 
        onBack={handleBackToPrograms} 
      />
    );
  } else if (selectedTopicId === null) {
    // Vue 3: Sujets
    content = (
      <TopicList
        programId={selectedProgramId}
        episodeId={selectedEpisodeId}
        episodeTitle={selectedEpisodeTitle}
        onSelectTopic={handleSelectTopic} 
        onBack={handleBackToEpisodes} 
      />
    );
  } else {
    // Vue 4: Médias
    content = (
      <MediaList
        programId={selectedProgramId}
        episodeId={selectedEpisodeId}
        topicId={selectedTopicId}
        topicTitle={selectedTopicTitle}
        onBack={handleBackToTopics} 
      />
    );
  }

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
  {selectedProgramId && selectedProgramTitle && window.programsList && window.programsList.find && window.programsList.find(p => p.id === selectedProgramId && p.logoUrl) ? (
    <img src={`http://localhost:3001${window.programsList.find(p => p.id === selectedProgramId).logoUrl}`} alt="logo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, marginRight: 8, verticalAlign: 'middle' }} />
  ) : (
    <FaFilm style={{verticalAlign:'middle', color: darkMode ? '#FFD166' : '#4F8CFF'}}/>
  )}
  {selectedProgramId && selectedProgramTitle ? selectedProgramTitle : 'Girr Remake'}
</div>
        <nav>
          {selectedProgramId !== null && (
            <button onClick={handleBackToPrograms}><FaListUl /> Programmes</button>
          )}
          {selectedProgramId !== null && selectedEpisodeId !== null && (
            <button onClick={handleBackToEpisodes}><FaBookOpen /> Épisodes</button>
          )}
          {selectedProgramId !== null && selectedEpisodeId !== null && selectedTopicId !== null && (
            <button onClick={handleBackToTopics}><FaArrowLeft /> Sujets</button>
          )}
        </nav>
        <button className="dark-toggle" onClick={toggleDarkMode} title={darkMode ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}>
          {darkMode ? <FaSun style={{color:'#FFD166'}}/> : <FaMoon style={{color:'#4F8CFF'}}/>}
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </button>
      </aside>
      <main>
        {selectedProgramId === null ? (
          <section className="card">
            <ProgramList onSelectProgram={handleSelectProgram} />
          </section>
        ) : selectedEpisodeId === null ? (
          <section className="card">
            <EpisodeList 
              programId={selectedProgramId}
              programTitle={selectedProgramTitle}
              onSelectEpisode={handleSelectEpisode}
              onBack={handleBackToPrograms}
            />
          </section>
        ) : selectedTopicId === null ? (
          <section className="card">
            <TopicList 
              programId={selectedProgramId}
              episodeId={selectedEpisodeId}
              episodeTitle={selectedEpisodeTitle}
              onSelectTopic={handleSelectTopic}
              onBack={handleBackToEpisodes}
            />
          </section>
        ) : (
          <section className="card">
            <MediaList 
              programId={selectedProgramId}
              episodeId={selectedEpisodeId}
              topicId={selectedTopicId}
              topicTitle={selectedTopicTitle}
              onBack={handleBackToTopics}
            />
          </section>
        )}
      </main>
    </>
  );
}

export default App;
