import React from 'react';
import { useTheme } from './ThemeContext';

export default function ThemeCustomizer() {
  const { colors, updateColors, resetColors } = useTheme();

  const handleColorChange = (colorKey, value) => {
    updateColors({ [colorKey]: value });
  };

  return (
    <div className="theme-customizer">
      <div className="color-inputs">
        <div className="color-input">
          <label>Couleur principale</label>
          <input
            type="color"
            value={colors.primary}
            onChange={(e) => handleColorChange('primary', e.target.value)}
          />
        </div>
        <div className="color-input">
          <label>Couleur d'accent</label>
          <input
            type="color"
            value={colors.accent}
            onChange={(e) => handleColorChange('accent', e.target.value)}
          />
        </div>
      </div>
      <button onClick={resetColors} className="reset-button">
        Réinitialiser les couleurs
      </button>

      <style>{`
        .theme-customizer {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        
        .color-inputs {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .color-input {
          flex: 1;
        }
        
        .color-input label {
          display: block;
          margin-bottom: 8px;
          color: var(--text);
        }
        
        .color-input input {
          width: 100%;
          height: 40px;
          padding: 4px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
        }
        
        .reset-button {
          width: 100%;
          padding: 8px 16px;
          background: var(--background);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-button:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}