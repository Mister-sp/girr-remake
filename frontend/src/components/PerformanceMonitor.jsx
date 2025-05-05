import React, { useState, useEffect } from 'react';
import performanceMonitor from '../services/performanceMonitor';

/**
 * Composant pour visualiser et contrôler le monitoring des performances
 */
const PerformanceMonitor = ({ collapsed = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [stats, setStats] = useState(() => performanceMonitor.getStats());
  const [slowOperations, setSlowOperations] = useState([]);
  const [isEnabled, setIsEnabled] = useState(stats.enabled);
  const [detailedTracing, setDetailedTracing] = useState(stats.detailedTracingEnabled);

  // Mettre à jour les statistiques périodiquement
  useEffect(() => {
    if (!isEnabled) return;

    const intervalId = setInterval(() => {
      setStats(performanceMonitor.getStats());
      setSlowOperations(performanceMonitor.getSlowOperations(10));
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isEnabled]);

  const toggleMonitoring = () => {
    const newState = !isEnabled;
    performanceMonitor.setEnabled(newState, detailedTracing);
    setIsEnabled(newState);
    
    if (newState) {
      setStats(performanceMonitor.getStats());
      setSlowOperations(performanceMonitor.getSlowOperations(10));
    }
  };

  const toggleDetailedTracing = () => {
    const newState = !detailedTracing;
    performanceMonitor.setEnabled(isEnabled, newState);
    setDetailedTracing(newState);
  };

  if (!isEnabled && isCollapsed) return null;

  const containerStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: '5px',
    padding: isCollapsed ? '8px' : '15px',
    maxWidth: isCollapsed ? '60px' : '400px',
    maxHeight: isCollapsed ? '30px' : '80vh',
    overflow: 'hidden',
    transition: 'all 0.3s',
    zIndex: 9999,
    fontSize: '12px',
    fontFamily: 'monospace',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
  };

  const buttonStyle = {
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    border: 'none',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '3px',
    margin: '0 5px 5px 0',
    cursor: 'pointer',
    fontSize: '11px'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  };

  const headerCellStyle = {
    textAlign: 'left',
    padding: '4px',
    borderBottom: '1px solid #444',
    fontSize: '11px'
  };

  const cellStyle = {
    padding: '3px 4px',
    borderBottom: '1px solid #333',
    fontSize: '10px'
  };

  const sectionTitleStyle = {
    borderBottom: '1px solid #444',
    margin: '10px 0 5px 0',
    fontSize: '13px',
    fontWeight: 'bold'
  };

  if (isCollapsed) {
    return (
      <div
        style={containerStyle}
        onClick={() => setIsCollapsed(false)}
        title="Moniteur de performance"
      >
        📊
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Moniteur de performance</h4>
        <button
          style={{ ...buttonStyle, padding: '2px 5px' }}
          onClick={() => setIsCollapsed(true)}
        >
          ✕
        </button>
      </div>

      <div>
        <button
          style={isEnabled ? activeButtonStyle : buttonStyle}
          onClick={toggleMonitoring}
        >
          {isEnabled ? 'Désactiver' : 'Activer'} le monitoring
        </button>

        {isEnabled && (
          <button
            style={detailedTracing ? activeButtonStyle : buttonStyle}
            onClick={toggleDetailedTracing}
          >
            Traçage {detailedTracing ? 'détaillé activé' : 'simple'}
          </button>
        )}
      </div>

      {isEnabled && (
        <>
          <div style={sectionTitleStyle}>Résumé</div>
          <div>Métriques totales: {stats.totalMetrics}</div>
          <div>Opérations en cours: {stats.operationsInProgress}</div>
          <div>Opérations lentes: {stats.slowOperations}</div>

          <div style={sectionTitleStyle}>Par catégorie</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Catégorie</th>
                <th style={headerCellStyle}>Nombre</th>
                <th style={headerCellStyle}>Moy. (ms)</th>
                <th style={headerCellStyle}>Max (ms)</th>
                <th style={headerCellStyle}>Lentes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.categorySummary).map(([category, data]) => (
                <tr key={category}>
                  <td style={cellStyle}>{category}</td>
                  <td style={cellStyle}>{data.count}</td>
                  <td style={cellStyle}>{data.avgDuration.toFixed(1)}</td>
                  <td style={cellStyle}>{data.maxDuration.toFixed(1)}</td>
                  <td style={cellStyle}>{data.slowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {slowOperations.length > 0 && (
            <>
              <div style={sectionTitleStyle}>Opérations les plus lentes</div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Opération</th>
                    <th style={headerCellStyle}>Cat.</th>
                    <th style={headerCellStyle}>Durée (ms)</th>
                    <th style={headerCellStyle}>Seuil</th>
                  </tr>
                </thead>
                <tbody>
                  {slowOperations.map((op, i) => (
                    <tr key={i}>
                      <td style={cellStyle}>{op.name}</td>
                      <td style={cellStyle}>{op.category}</td>
                      <td style={cellStyle}>{op.duration.toFixed(1)}</td>
                      <td style={cellStyle}>{op.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PerformanceMonitor;