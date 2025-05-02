# API Documentation

## Points d'entrée principaux

### Programmes
```
GET /api/programs
POST /api/programs
GET /api/programs/:id
PUT /api/programs/:id
DELETE /api/programs/:id
```

### Épisodes
```
GET /api/programs/:programId/episodes
POST /api/programs/:programId/episodes
GET /api/programs/:programId/episodes/:id
PUT /api/programs/:programId/episodes/:id
DELETE /api/programs/:programId/episodes/:id
```

### Sujets (Topics)
```
GET /api/programs/:programId/episodes/:episodeId/topics
POST /api/programs/:programId/episodes/:episodeId/topics
GET /api/programs/:programId/episodes/:episodeId/topics/:id
PUT /api/programs/:programId/episodes/:episodeId/topics/:id
DELETE /api/programs/:programId/episodes/:episodeId/topics/:id
```

### Médias
```
GET /api/programs/:programId/episodes/:episodeId/topics/:topicId/media
POST /api/programs/:programId/episodes/:episodeId/topics/:topicId/media
DELETE /api/programs/:programId/episodes/:episodeId/topics/:topicId/media/:id
```

### Paramètres
```
GET /api/settings/transitions
POST /api/settings/transitions
GET /api/settings/backups
POST /api/settings/backups
GET /api/settings/backups/config
PUT /api/settings/backups/config
GET /api/settings/export
POST /api/settings/import
POST /api/settings/import-legacy
```

### Scène
```
GET /api/scene
PUT /api/scene
```

## Points de monitoring

### Métriques
```
GET /metrics
```
Métriques Prometheus pour :
- Utilisation CPU/mémoire
- Requêtes HTTP
- WebSocket connections
- Compteurs (topics, médias)

### Santé
```
GET /health
```
- État du serveur
- Uptime
- Timestamp

### Documentation interactive
```
GET /api-docs
```
Interface Swagger pour tester l'API