# Architecture de FREMEN

## Vue d'ensemble

FREMEN est une application de régie pour le streaming composée de deux parties principales :

### Frontend (React/Vite)
- Interface utilisateur moderne et responsive
- Composants réutilisables
- Gestion d'état avec React Context
- WebSocket pour les mises à jour en temps réel
- Thèmes clair/sombre
- Prévisualisation OBS intégrée

### Backend (Node.js/Express)
- API RESTful
- Stockage JSON avec système de backup
- WebSocket pour la synchronisation temps réel
- Logging et monitoring
- Documentation Swagger

## Structure des données

### Programme
- Informations de base (titre, description)
- Configuration du logo
- Configuration du lower third
- Liste d'épisodes

### Épisode
- Informations de base
- Liste de sujets (topics)
- Paramètres hérités du programme

### Sujet (Topic)
- Titre et description
- Script/Notes
- Médias associés
- Position dans l'épisode

### Média
- Type (image, vidéo YouTube, lien)
- Contenu
- Position dans le sujet

## Flux de données

### WebSocket Events
- `obs:update` : Mise à jour de l'affichage OBS
- `settings:transitions:update` : Mise à jour des paramètres de transition
- `store:update` : Mise à jour globale des données
- `clients:update` : Mise à jour des clients connectés