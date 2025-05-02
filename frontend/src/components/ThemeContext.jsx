import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const defaultTheme = {
  primary: '#4F8CFF',
  accent: '#FFD166'
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [customColors, setCustomColors] = useState(() => {
    const saved = localStorage.getItem('girr-custom-colors');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    // Sauvegarder les couleurs dans localStorage
    localStorage.setItem('girr-custom-colors', JSON.stringify(customColors));
    
    // Appliquer les variables CSS
    Object.entries(customColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--user-${key}`, value);
    });
  }, [customColors]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const updateColors = (colors) => {
    setCustomColors(prev => ({
      ...prev,
      ...colors
    }));
  };

  const resetColors = () => {
    setCustomColors(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleDarkMode,
      colors: customColors,
      updateColors,
      resetColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}