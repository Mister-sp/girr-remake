/**
 * Contexte pour la gestion des raccourcis clavier.
 * @module components/KeyBindingsContext
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Configuration par défaut des raccourcis.
 * @constant {Object}
 */
const DEFAULT_KEY_BINDINGS = {
  nextTopic: 'ArrowDown',
  previousTopic: 'ArrowUp',
  nextMedia: 'ArrowRight',
  previousMedia: 'ArrowLeft',
  playPause: ' ',
  titrage: 't',
  fullscreen: 'f',
  toggleRegieMode: 'g'
};

/**
 * Contexte des raccourcis clavier.
 * @type {React.Context}
 */
const KeyBindingsContext = createContext();

/**
 * Hook pour utiliser les raccourcis clavier.
 * @returns {Object} Raccourcis actuels et fonction de mise à jour
 */
export function useKeyBindings() {
  const context = useContext(KeyBindingsContext);
  if (!context) {
    throw new Error('useKeyBindings must be used within a KeyBindingsProvider');
  }
  return context;
}

/**
 * Provider pour les raccourcis clavier.
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 */
export function KeyBindingsProvider({ children }) {
  const [keyBindings, setKeyBindings] = useState(() => {
    // Charger les raccourcis depuis le localStorage ou utiliser les défauts
    const saved = localStorage.getItem('keyBindings');
    return saved ? JSON.parse(saved) : DEFAULT_KEY_BINDINGS;
  });

  useEffect(() => {
    localStorage.setItem('keyBindings', JSON.stringify(keyBindings));
  }, [keyBindings]);

  /**
   * Met à jour un raccourci.
   * @param {string} action - Action à lier
   * @param {string} key - Touche à associer
   */
  const updateKeyBinding = (action, key) => {
    const newBindings = { ...keyBindings, [action]: key };
    setKeyBindings(newBindings);
    localStorage.setItem('keyBindings', JSON.stringify(newBindings));
  };

  /**
   * Réinitialise les raccourcis par défaut.
   */
  const resetKeyBindings = () => {
    setKeyBindings(DEFAULT_KEY_BINDINGS);
    localStorage.setItem('keyBindings', JSON.stringify(DEFAULT_KEY_BINDINGS));
  };

  return (
    <KeyBindingsContext.Provider value={{ 
      keyBindings, 
      updateKeyBinding,
      resetKeyBindings,
      DEFAULT_KEY_BINDINGS 
    }}>
      {children}
    </KeyBindingsContext.Provider>
  );
}

export default KeyBindingsContext;