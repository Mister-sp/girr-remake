import React, { useState, useEffect } from 'react';
import { getTransitionSettings, updateTransitionSettings } from '../services/api';
import './media-effects.css';

function Settings() {
  const [settings, setSettings] = useState({
    appearEffect: 'fade',
    disappearEffect: 'fade',
    duration: 0.5,
    timing: 'ease-in-out',
    slideDistance: 40,
    zoomScale: 0.8,
    rotateAngle: -10
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getTransitionSettings();
      setSettings(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError('Impossible de charger les paramètres');
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTransitionSettings(settings);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres:', err);
      setError('Impossible de sauvegarder les paramètres');
    } finally {
      setSaving(false);
    }
  };

  // Prévisualisation avec les effets actuels
  const Preview = () => {
    const [show, setShow] = useState(true);
    const togglePreview = () => setShow(prev => !prev);

    const mediaStyle = {
      width: '200px',
      height: '150px',
      backgroundColor: '#4CAF50',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      borderRadius: '8px',
      margin: '20px auto'
    };

    useEffect(() => {
      // Appliquer les variables CSS pour la prévisualisation
      document.documentElement.style.setProperty('--media-transition-duration', `${settings.duration}s`);
      document.documentElement.style.setProperty('--media-transition-timing', settings.timing);
      document.documentElement.style.setProperty('--media-slide-distance', `${settings.slideDistance}px`);
      document.documentElement.style.setProperty('--media-zoom-scale', settings.zoomScale);
      document.documentElement.style.setProperty('--media-rotate-angle', `${settings.rotateAngle}deg`);
    }, [settings]);

    return (
      <div style={{textAlign: 'center', marginTop: '20px'}}>
        <div style={{marginBottom: '10px'}}>
          <button 
            onClick={togglePreview}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {show ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <div style={{position: 'relative', height: '170px'}}>
          {show && (
            <div 
              className={`media-effect-${settings.appearEffect}`}
              style={mediaStyle}
            >
              Prévisualisation
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{maxWidth: '600px', margin: '20px auto', padding: '20px'}}>
      <h2 style={{marginBottom: '20px', color: '#333'}}>Paramètres des transitions</h2>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Effet d'apparition
          </label>
          <select
            value={settings.appearEffect}
            onChange={(e) => handleChange('appearEffect', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="fade">Fondu</option>
            <option value="slide">Glissement</option>
            <option value="scale">Échelle</option>
            <option value="flip">Retournement</option>
            <option value="none">Aucun</option>
          </select>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Effet de disparition
          </label>
          <select
            value={settings.disappearEffect}
            onChange={(e) => handleChange('disappearEffect', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="fade">Fondu</option>
            <option value="slide">Glissement</option>
            <option value="scale">Échelle</option>
            <option value="flip">Retournement</option>
            <option value="none">Aucun</option>
          </select>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Durée (secondes)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="2"
            value={settings.duration}
            onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Courbe d'animation
          </label>
          <select
            value={settings.timing}
            onChange={(e) => handleChange('timing', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="linear">Linéaire</option>
            <option value="ease">Ease</option>
            <option value="ease-in">Ease In</option>
            <option value="ease-out">Ease Out</option>
            <option value="ease-in-out">Ease In Out</option>
          </select>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Distance de glissement (px)
          </label>
          <input
            type="number"
            step="10"
            min="0"
            max="200"
            value={settings.slideDistance}
            onChange={(e) => handleChange('slideDistance', parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Échelle de zoom (0-1)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="1"
            value={settings.zoomScale}
            onChange={(e) => handleChange('zoomScale', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Angle de rotation (degrés)
          </label>
          <input
            type="number"
            step="5"
            min="-180"
            max="180"
            value={settings.rotateAngle}
            onChange={(e) => handleChange('rotateAngle', parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <Preview />

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: saving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </button>
      </form>
    </div>
  );
}

export default Settings;