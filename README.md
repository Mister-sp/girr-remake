# FREMEN

*Flow de Régie d'Écrans, de Médias, d'Événements et de News*

**Tel Shai-Hulud, maîtrisez le stream**

FREMEN est un outil moderne et modulaire de régie pour le streaming, la gestion d'événements, de médias et d'actualités. Successeur spirituel du projet [Girr](https://github.com/chriscamicas/girr), il étend la vision d'origine avec une interface modernisée et de nouvelles fonctionnalités.

## Architecture

Le projet est composé de deux parties principales :
- `frontend/` : Application React/Vite pour l'interface utilisateur et les overlays OBS
- `backend/` : API Node.js/Express pour la gestion des données et la synchronisation temps réel

## Prérequis

- Node.js (version 18+ recommandée)
- npm (généralement inclus avec Node.js)
- Un navigateur moderne (Chrome/Firefox/Edge récent)
- OBS Studio pour la diffusion

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd fremen
```

2. Installez les dépendances du backend :
```bash
cd backend
npm install
cd ..
```

3. Installez les dépendances du frontend :
```bash
cd frontend
npm install
cd ..
```

## Lancement

1. Lancez le serveur backend (depuis le dossier `backend/`) :
```bash
cd backend
npm start
```
Le serveur écoutera sur `http://localhost:3001`.

2. Lancez le serveur de développement frontend (depuis le dossier `frontend/`) :
```bash
cd frontend
npm run dev
```
L'application sera accessible sur `http://localhost:5173` (ou un autre port indiqué par Vite).

## Fonctionnalités principales

### Gestion de contenu
- Programmes, Épisodes et Sujets (CRUD complet)
- Médias associés aux sujets (texte, vidéo YouTube)
- Upload et gestion des logos par programme
- Prévisualisation des vidéos YouTube

### Gestion des paramètres globaux
- Interface unifiée pour tous les paramètres
- Export/Import de configuration complet
  - Sauvegarde de tous les paramètres (programmes, épisodes, sujets, médias)
  - Import avec validation des données
  - Import depuis l'ancien GIRR (à tester) avec conversion automatique
  - Gestion automatique des IDs pour éviter les conflits
  - Interface intuitive dans la section Paramètres
- Système de backup automatique
  - Sauvegarde automatique configurable (intervalle personnalisable)
  - Conservation paramétrable des anciennes sauvegardes
  - Rotation automatique des sauvegardes
  - Création manuelle de sauvegardes
  - Interface de restauration des sauvegardes
  - Activation/désactivation des sauvegardes automatiques
- Gestion des effets de transition
  - Personnalisation des effets d'apparition/disparition
  - Application en temps réel
  - Preview intégré
- Raccourcis clavier optimisés
  - 'L' pour accéder rapidement aux paramètres
  - Aide contextuelle avec tous les raccourcis ('?')

### Barre de statut
- Aperçu OBS en temps réel
- Statut des connexions WebSocket
- Compteur de clients connectés
- Boutons d'accès rapide aux fenêtres OBS
- Indicateurs de statut pour chaque type de sortie

### Documentation et Développement
- Documentation API interactive avec Swagger (/api-docs)
  - Description complète de tous les endpoints
  - Interface de test intégrée
  - Schémas de données détaillés
- Système de logging avancé
  - Logs séparés pour les erreurs et informations
  - Format JSON pour une meilleure analyse
  - Niveaux de log configurables
  - Rotation automatique des fichiers de log
- Export/Import des configurations
  - Sauvegarde complète des données
  - Import avec validation
  - Gestion automatique des IDs
  - Interface utilisateur intuitive

### Interface moderne
- Design responsive avec affichage en cartes
- Modals et formulaires intuitifs
- Navigation claire et épurée
- Footer avec preview OBS intégré
- Sidebar avec accès rapide aux fonctions principales
- Raccourcis clavier pour les actions principales

### Mode présentateur
- Vue en grille (mode régie) pour accès rapide à tous les sujets
- Aperçu des médias avec icônes par type (images, vidéos, liens)
- Navigation précédent/suivant entre les sujets
- Notes par sujet en temps réel
- Raccourcis clavier personnalisables
- Preview OBS intégrée
- Interface sombre optimisée

### Overlays OBS
- Lower third (titrage) personnalisable
- Effets de transition sur les médias
- Effets visuels sur les logos
- Preview temps réel dans l'interface

### Synchronisation temps réel
- WebSocket pour mises à jour instantanées
- Multi-clients (utilisation sur plusieurs appareils)
- Feedback en temps réel (notifications)

## Déploiement

Le projet inclut des configurations pour plusieurs plateformes cloud :

### Plateformes recommandées
- Backend : Render ou Railway
- Frontend : Netlify ou Vercel

### Fichiers de configuration inclus
- `render.yaml` : déploiement Render
- `railway.json` : déploiement Railway
- `netlify.toml` : déploiement Netlify
- `vercel.json` : déploiement Vercel

Pour plus de détails sur le déploiement, voir la section dédiée plus bas.

## Documentation technique

### Lower Third (titrage)
Le composant `LowerThird` offre un rendu broadcast-ready :
- Bandeau adaptatif pleine largeur
- Retour à la ligne intelligent
- Personnalisation complète (polices, couleurs, effets)
- Transitions fluides
- Rendu identique preview/output

### Aperçu OBS (preview)
Le composant `ObsPreview` permet une prévisualisation fidèle :
- Ratio 16:9 maintenu
- Mise à l'échelle intelligente
- Synchronisation temps réel
- Performances optimisées

### Système de backup
Le système de backup automatique assure la sécurité des données :
- Sauvegardes périodiques configurables (intervalle minimum : 30 minutes)
- Conservation paramétrable du nombre de sauvegardes (1 à ∞)
- Format JSON standardisé pour les sauvegardes
- Rotation automatique des anciennes sauvegardes
- Restauration possible vers n'importe quelle sauvegarde
- Validation des données lors de la restauration
- Stockage local dans le dossier `backend/data/backups`

## Roadmap

### Frontend
- Mode sombre / thème personnalisable
- Effets de transition additionnels
- Drag & drop optimisé
- Tests automatisés
- Optimisation responsive design
  - Sidebar adaptative (menu hamburger sur mobile)
  - Grilles fluides pour médias et programmes
  - Contrôles tactiles optimisés (44px minimum)
  - Adaptation des espacements pour petits écrans
  - Expérience mobile améliorée

### Backend
- Optimisation performances
- Support des sauvegardes distantes (cloud)
- API pour les sauvegardes externes

### Infrastructure
- CI/CD complet
- Monitoring
- Haute disponibilité
- Docker compose pour déploiement rapide
- Scripts d'installation automatisée

## License

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Pour plus d'informations sur les changements récents, consultez le [CHANGELOG.md](CHANGELOG.md).
