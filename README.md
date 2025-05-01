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

## Roadmap

### Frontend
- Mode sombre / thème personnalisable
- Effets de transition additionnels
- Drag & drop optimisé
- Tests automatisés

### Backend
- Documentation API (Swagger)
- Logger avancé
- Optimisation performances
- Export/Import des configurations
- System de backup automatique

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
