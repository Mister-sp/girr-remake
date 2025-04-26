import { useEffect, useState as useReactState } from 'react';
import { useState } from 'react';
import './modern-ui.css';
import './toasts-and-modal.css';
import './modern-layout.css';
import { ToastProvider } from './components/ToastProvider.jsx';
import ProgramList from './components/ProgramList.jsx';
import EpisodeList from './components/EpisodeList';
import TopicList from './components/TopicList';
import CustomMediaList from "./components/CustomMediaList";
import ObsOutput from './components/ObsOutput';
import ObsMediaOutput from './components/ObsMediaOutput';
import ObsTitrageOutput from './components/ObsTitrageOutput';
import AppWebSocketTest from './AppWebSocketTest';
import SceneTest from './SceneTest.jsx';
import LiveControl from './LiveControl.jsx';
import LiveControlFooter from './LiveControlFooter.jsx';
import Sidebar from './components/Sidebar.jsx';
import EpisodeFullView from './components/EpisodeFullView.jsx';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';

function AppWithNavigation() {
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

  const navigate = useNavigate();
  // Sélection d'un programme
  const handleSelectProgram = (programId, programTitle) => {
    setSelectedProgramId(programId);
    setSelectedProgramTitle(programTitle);
    setSelectedEpisodeId(null);
    setSelectedEpisodeTitle('');
    setSelectedTopicId(null);
    setSelectedTopicTitle('');
    navigate(`/program/${programId}/episodes`);
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

  return (
    <Routes>
      <Route path="/obs" element={<ObsOutput />} />
      <Route path="/obs-media" element={<ObsMediaOutput />} />
      <Route path="/obs-titrage" element={<ObsTitrageOutput />} />
      <Route path="*" element={
        <>
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <main className="main-content-scrollable" style={{ marginLeft: 220, padding: '24px 16px 80px 16px', background: darkMode ? '#181a1b' : '#f7f7fa' }}>
            <Routes>
              <Route path="/" element={<ProgramList onSelectProgram={handleSelectProgram} />} />
              <Route path="/program/:programId/episodes" element={<EpisodeList onSelectEpisode={handleSelectEpisode} onBack={handleBackToPrograms} />} />
              <Route path="/program/:programId/episode/:episodeId/topics" element={<TopicList onSelectTopic={handleSelectTopic} onBack={handleBackToEpisodes} />} />
              <Route path="/program/:programId/episode/:episodeId" element={<EpisodeFullView />} />
              <Route path="/program/:programId/episode/:episodeId/topic/:topicId" element={<CustomMediaList onBack={handleBackToTopics} />} />
              <Route path="/test-websocket" element={<AppWebSocketTest />} />
              <Route path="/scene-test" element={<SceneTest />} />
              <Route path="/live-control" element={<LiveControl />} />
            </Routes>
          </main>
          <LiveControlFooter />
        </>
      } />
    </Routes>
  );
}

// Navigation entre overlays OBS
function ObsOutputNavigation() {
  return (
    <div style={{position:'fixed',top:20,left:20,zIndex:100000}}>
      <a href="/obs" style={{marginRight:8,padding:'8px 12px',background:'#333',color:'#fff',borderRadius:6,textDecoration:'none'}}>Média + Titrage</a>
      <a href="/obs-media" style={{marginRight:8,padding:'8px 12px',background:'#333',color:'#fff',borderRadius:6,textDecoration:'none'}}>Média seul</a>
      <a href="/obs-titrage" style={{padding:'8px 12px',background:'#333',color:'#fff',borderRadius:6,textDecoration:'none'}}>Titrage seul</a>
    </div>
  );
}

export default AppWithNavigation;
