import React, { createContext, useContext, useState, useEffect } from 'react';

const KeyBindingsContext = createContext();

const defaultKeyBindings = {
  nextTopic: 'pagedown',
  previousTopic: 'pageup',
  nextMedia: 'right',
  previousMedia: 'left',
  playPause: 'space',
  titrage: 't',
  fullscreen: 'f',
  toggleRegieMode: 'alt+r'
};

export function KeyBindingsProvider({ children }) {
  const [keyBindings, setKeyBindings] = useState(() => {
    const stored = localStorage.getItem('keyBindings');
    return stored ? JSON.parse(stored) : defaultKeyBindings;
  });

  useEffect(() => {
    localStorage.setItem('keyBindings', JSON.stringify(keyBindings));
  }, [keyBindings]);

  const updateKeyBinding = (action, newKey) => {
    setKeyBindings(prev => ({
      ...prev,
      [action]: newKey
    }));
  };

  const resetToDefaults = () => {
    setKeyBindings(defaultKeyBindings);
  };

  return (
    <KeyBindingsContext.Provider value={{ keyBindings, updateKeyBinding, resetToDefaults, defaultKeyBindings }}>
      {children}
    </KeyBindingsContext.Provider>
  );
}

export function useKeyBindings() {
  const context = useContext(KeyBindingsContext);
  if (!context) {
    throw new Error('useKeyBindings must be used within a KeyBindingsProvider');
  }
  return context;
}