import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TRANSITION_EFFECTS = [
  { label: 'Fondu', value: 'fade' },
  { label: 'Glissement', value: 'slide' },
  { label: 'Échelle', value: 'scale' },
  { label: 'Retournement', value: 'flip' },
  { label: 'Aucun', value: 'none' }
];

const cardStyle = {
  background: 'var(--background-lighter)',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  color: 'var(--text)',
  fontSize: 14
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 4,
  background: 'var(--input-background)',
  color: 'var(--text)'
};

const buttonStyle = {
  width: '100%',
  marginTop: 16,
  padding: '10px',
  background: '#4F8CFF',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  ':hover': {
    background: '#3E7BFF'
  },
  ':disabled': {
    background: '#ccc',
    cursor: 'not-allowed'
  }
};

export default function Settings() {
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [backups, setBackups] = useState([]);
  const [backupConfig, setBackupConfig] = useState({
    maxBackups: 10,
    intervalHours: 1,
    enabled: true
  });
  const [mediaEffects, setMediaEffects] = useState({
    appearEffect: 'fade',
    disappearEffect: 'fade'
  });

  useEffect(() => {
    // Initialiser la connexion WebSocket
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    
    // Écouter les mises à jour des paramètres
    socket.on('settings:transitions:update', (data) => {
      setMediaEffects({
        appearEffect: data.appearEffect || 'fade',
        disappearEffect: data.disappearEffect || 'fade'
      });
    });

    // Charger les paramètres initiaux
    fetch('http://localhost:3001/api/scene')
      .then(res => res.json())
      .then(data => {
        setMediaEffects({
          appearEffect: data.appearEffect || 'fade',
          disappearEffect: data.disappearEffect || 'fade'
        });
      })
      .catch(console.error);

    return () => socket.disconnect();
  }, []);

  // Charger la liste des backups
  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/backups');
      if (!response.ok) throw new Error('Erreur lors du chargement des backups');
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les backups');
    }
  };

  // Charger les paramètres de backup
  useEffect(() => {
    fetch('http://localhost:3001/api/settings/backups/config')
      .then(res => res.json())
      .then(config => {
        setBackupConfig(config);
      })
      .catch(console.error);
  }, []);

  // Créer un backup manuel
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/settings/backups', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erreur lors de la création du backup');
      
      setSuccess('Backup créé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recharger la liste des backups
      await fetchBackups();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création du backup');
    } finally {
      setLoading(false);
    }
  };

  // Restaurer un backup
  const handleRestoreBackup = async (filename) => {
    if (!window.confirm('Êtes-vous sûr de vouloir restaurer ce backup ? Cela écrasera toutes les données actuelles.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`http://localhost:3001/api/settings/backups/${filename}/restore`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erreur lors de la restauration du backup');
      
      setSuccess('Backup restauré avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la restauration du backup');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des effets de transition
  const updateTransitionEffects = async () => {
    try {
      setLoading(true);
      setSuccess('');
      setError('');
      
      const res = await fetch('http://localhost:3001/api/scene', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mediaAppearEffect: mediaEffects.appearEffect,
          mediaDisappearEffect: mediaEffects.disappearEffect
        })
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour des effets');
      }

      setSuccess('Les effets ont été mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setSuccess('Erreur lors de la mise à jour des effets');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la configuration des backups
  const handleUpdateBackupConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/settings/backups/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupConfig)
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la configuration');
      
      const updatedConfig = await response.json();
      setBackupConfig(updatedConfig);
      setSuccess('Configuration des sauvegardes mise à jour');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour de la configuration des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  // Export de la configuration
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/settings/export');
      if (!response.ok) throw new Error('Erreur lors de l\'export');
      
      const jsonData = await response.json();
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fremen-config.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Configuration exportée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError('Erreur lors de l\'export de la configuration');
    } finally {
      setLoading(false);
    }
  };

  // Import de la configuration
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        setError('');
        const config = JSON.parse(e.target.result);
        const response = await fetch('http://localhost:3001/api/settings/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config)
        });

        if (!response.ok) throw new Error('Erreur lors de l\'import');

        setSuccess('Configuration importée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        // Recharger la page pour voir les changements
        window.location.reload();
      } catch (err) {
        console.error('Erreur lors de l\'import:', err);
        setError('Erreur lors de l\'import de la configuration');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Import depuis l'ancien GIRR
  const handleLegacyImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        setError('');
        const legacyConfig = JSON.parse(e.target.result);
        const response = await fetch('http://localhost:3001/api/settings/import-legacy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(legacyConfig)
        });

        if (!response.ok) throw new Error('Erreur lors de l\'import');

        const result = await response.json();
        setSuccess(`Import réussi depuis l'ancien GIRR : ${result.imported.programs} programmes, ${result.imported.episodes} épisodes, ${result.imported.topics} sujets, ${result.imported.mediaItems} médias`);
        setTimeout(() => setSuccess(''), 5000);
        // Recharger la page pour voir les changements
        window.location.reload();
      } catch (err) {
        console.error('Erreur lors de l\'import depuis l\'ancien GIRR:', err);
        setError('Erreur lors de l\'import depuis l\'ancien GIRR');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{padding: '20px', maxWidth: 800, margin: '0 auto'}}>
      <h1 style={{marginBottom: 24, color: 'var(--text)'}}>Paramètres généraux</h1>
      
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16}}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: wsConnected ? '#4CAF50' : '#F44336'
        }} />
        <span style={{fontSize: 14, color: 'var(--text-light)'}}>
          {wsConnected ? 'Connecté au serveur' : 'Déconnecté du serveur'}
        </span>
      </div>

      <div style={{...cardStyle, marginBottom: 20}}>
        <h2 style={{marginTop: 0, marginBottom: 24, color: 'var(--text)'}}>Sauvegardes automatiques</h2>
        <div style={{marginBottom: 20}}>
          <div style={{marginBottom: 16}}>
            <label style={labelStyle}>État des sauvegardes automatiques</label>
            <select
              value={backupConfig.enabled.toString()}
              onChange={(e) => setBackupConfig(prev => ({
                ...prev,
                enabled: e.target.value === 'true'
              }))}
              style={inputStyle}
            >
              <option value="true">Activées</option>
              <option value="false">Désactivées</option>
            </select>
          </div>

          <div style={{marginBottom: 16}}>
            <label style={labelStyle}>Intervalle entre les sauvegardes (heures)</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={backupConfig.intervalHours}
              onChange={(e) => setBackupConfig(prev => ({
                ...prev,
                intervalHours: parseFloat(e.target.value)
              }))}
              style={inputStyle}
            />
          </div>

          <div style={{marginBottom: 16}}>
            <label style={labelStyle}>Nombre maximum de sauvegardes</label>
            <input
              type="number"
              min="1"
              step="1"
              value={backupConfig.maxBackups}
              onChange={(e) => setBackupConfig(prev => ({
                ...prev,
                maxBackups: parseInt(e.target.value)
              }))}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleUpdateBackupConfig}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: 20,
              width: '100%'
            }}
            disabled={loading}
          >
            {loading ? 'Mise à jour...' : 'Appliquer la configuration'}
          </button>

          <p style={{marginBottom: 16, color: 'var(--text-light)', fontSize: 14}}>
            {backupConfig.enabled 
              ? `Sauvegarde automatique toutes les ${backupConfig.intervalHours} heure${backupConfig.intervalHours > 1 ? 's' : ''}, conservation des ${backupConfig.maxBackups} dernières sauvegardes.`
              : 'Les sauvegardes automatiques sont désactivées.'}
          </p>
          
          <button
            onClick={handleCreateBackup}
            style={{
              padding: '10px 20px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: 20
            }}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer une sauvegarde manuelle'}
          </button>

          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 4
          }}>
            {backups.length === 0 ? (
              <div style={{padding: 16, color: 'var(--text-light)', textAlign: 'center'}}>
                Aucune sauvegarde disponible
              </div>
            ) : (
              backups.map((filename) => (
                <div key={filename} style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <span style={{color: 'var(--text)', fontSize: 14}}>
                    {filename.replace('backup-', '').replace('.json', '')}
                  </span>
                  <button
                    onClick={() => handleRestoreBackup(filename)}
                    style={{
                      padding: '4px 12px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                    disabled={loading}
                  >
                    Restaurer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{...cardStyle, marginBottom: 20}}>
        <h2 style={{marginTop: 0, marginBottom: 24, color: 'var(--text)'}}>Export/Import de la configuration</h2>
        
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

        <div style={{display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Export...' : 'Exporter la configuration'}
          </button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{display: 'none'}}
              id="import-config"
              disabled={loading}
            />
            <label
              htmlFor="import-config"
              style={{
                padding: '10px 20px',
                background: '#2196F3',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Import...' : 'Importer une configuration'}
            </label>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleLegacyImport}
              style={{display: 'none'}}
              id="import-legacy"
              disabled={loading}
            />
            <label
              htmlFor="import-legacy"
              style={{
                padding: '10px 20px',
                background: '#9C27B0',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Import...' : 'Importer depuis l\'ancien GIRR'}
            </label>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--text-light)',
          marginBottom: '20px'
        }}>
          <strong>Note sur l'import depuis l'ancien GIRR :</strong>
          <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
            <li>Importez le fichier JSON exporté depuis l'ancien GIRR</li>
            <li>Les données seront converties automatiquement vers le nouveau format</li>
            <li>Les IDs seront regénérés pour éviter les conflits</li>
            <li>Les effets visuels seront configurés avec des valeurs par défaut</li>
          </ul>
        </div>

        {success && (
          <div style={{textAlign:'center', color:'#4CAF50', fontWeight:500, fontSize:14}}>{success}</div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{marginTop: 0, marginBottom: 24, color: 'var(--text)'}}>Effets de transition</h2>
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <label style={labelStyle}>Effet d'apparition</label>
            <select 
              value={mediaEffects.appearEffect}
              onChange={(e) => setMediaEffects(prev => ({ ...prev, appearEffect: e.target.value }))}
              style={inputStyle}
              disabled={loading}
            >
              {TRANSITION_EFFECTS.map(effect => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>

          <div style={{flex:1}}>
            <label style={labelStyle}>Effet de disparition</label>
            <select
              value={mediaEffects.disappearEffect}
              onChange={(e) => setMediaEffects(prev => ({ ...prev, disappearEffect: e.target.value }))}
              style={inputStyle}
              disabled={loading}
            >
              {TRANSITION_EFFECTS.map(effect => (
                <option key={effect.value} value={effect.value}>{effect.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={updateTransitionEffects}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Mise à jour...' : 'Appliquer les effets'}
        </button>
        
        {success && (
          <div style={{textAlign:'center', color:'#4CAF50', fontWeight:500, fontSize:14, marginTop:12}}>{success}</div>
        )}
      </div>
    </div>
  );
}
