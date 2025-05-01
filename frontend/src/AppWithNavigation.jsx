import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider.jsx';
import { useHotkeys } from 'react-hotkeys-hook';
import './modern-ui.css';
import './toasts-and-modal.css';
import './modern-layout.css';
import ProgramList from './components/ProgramList.jsx';
import EpisodeList from './components/EpisodeList';
import TopicList from './components/TopicList';
import CustomMediaList from "./components/CustomMediaList";
import ObsOutput from './components/ObsOutput';
import ObsMediaOutput from './components/ObsMediaOutput';
import ObsTitrageOutput from './components/ObsTitrageOutput';
import AppWebSocketTest from './AppWebSocketTest';
import Settings from './Settings.jsx';
import StatusBar from './StatusBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import EpisodeFullView from './components/EpisodeFullView.jsx';
import ConnectedClients from './components/ConnectedClients';
import HelpModal from './components/HelpModal';
import PresenterView from './components/PresenterView';
import { KeyBindingsProvider } from './components/KeyBindingsContext';

function AppWithNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dark mode state & logic
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    // Use system preference by default
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => setDarkMode((d) => !d);

  // Help modal state
  const [showHelp, setShowHelp] = useState(false);

  // Raccourcis clavier globaux
  useHotkeys('h', () => navigate('/'), { description: 'Retour à l\'accueil' });
  useHotkeys('l', () => navigate('/control'), { description: 'Accéder aux paramètres' });
  useHotkeys('escape', () => {
    if (location.pathname !== '/') {
      navigate(-1);
    }
  }, { description: 'Retour en arrière' });
  useHotkeys('d', toggleDarkMode, { description: 'Basculer le mode sombre' });
  useHotkeys('shift+n', () => setShowModal(true), { description: 'Nouveau programme/épisode/sujet' });
  useHotkeys('/', () => document.querySelector('input[type="text"]')?.focus(), { description: 'Focus sur le champ de recherche' });
  useHotkeys('p', () => {
    const currentPath = location.pathname;
    if (currentPath.includes('/program/') && currentPath.includes('/episode/')) {
      const presentPath = currentPath + '/present';
      navigate(presentPath);
    }
  }, { description: 'Mode présentation' });
  useHotkeys('shift+t', () => {
    const topicTitle = selectedTopicTitle;
    if (topicTitle) {
      import('./services/websocket').then(({ connectWebSocket }) => {
        const socket = connectWebSocket();
        socket.emit('obs:update', { title: topicTitle });
      });
    }
  }, { description: 'Lancer le titrage du sujet sélectionné' });

  // Ajout du raccourci ? pour l'aide
  useHotkeys('?', () => setShowHelp(true), { description: 'Afficher l\'aide' });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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
    <KeyBindingsProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Routes>
          <Route path="/obs" element={<ObsOutput />} />
          <Route path="/obs-media" element={<ObsMediaOutput />} />
          <Route path="/obs-titrage" element={<ObsTitrageOutput />} />
          <Route path="/program/:programId/episode/:episodeId/present" element={<PresenterView />} />
          <Route path="*" element={
            <>
              <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <main className="main-content-scrollable" style={{ marginLeft: 220, padding: '24px 16px 80px 16px', background: darkMode ? '#181a1b' : '#f7f7fa' }}>
                <Routes>
                  <Route path="/" element={<ProgramList onSelectProgram={handleSelectProgram} />} />
                  <Route path="/control" element={<Settings />} />
                  <Route path="/program/:programId/episodes" element={<EpisodeList onSelectEpisode={handleSelectEpisode} onBack={handleBackToPrograms} />} />
                  <Route path="/program/:programId/episode/:episodeId/topics" element={<TopicList onSelectTopic={handleSelectTopic} onBack={handleBackToEpisodes} />} />
                  <Route path="/program/:programId/episode/:episodeId" element={<EpisodeFullView />} />
                  <Route path="/program/:programId/episode/:episodeId/topic/:topicId" element={<CustomMediaList onBack={handleBackToTopics} />} />
                  <Route path="/test-websocket" element={<AppWebSocketTest />} />
                </Routes>
              </main>
              <StatusBar />
              {/* Modal d'aide */}
              <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
            </>
          } />
        </Routes>
      </div>
    </KeyBindingsProvider>
  );
}

export default function AppWithNavigationWrapper() {
  return (
    <ToastProvider>
      <ConnectedClients />
      <AppWithNavigation />
    </ToastProvider>
  );
}
