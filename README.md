# Girr Remake Project

Ce projet est une tentative de recréer des fonctionnalités de l'application Girr.
Il est composé de deux parties :

-   `frontend/`: Une application React (utilisant Vite) pour l'interface utilisateur.
-   `backend/`: Une API Node.js/Express pour la gestion des données (actuellement en mémoire).

## Prérequis

-   Node.js (version 18+ recommandée)
-   npm (généralement inclus avec Node.js)

## Installation

1.  Clonez le dépôt.
2.  Installez les dépendances pour le backend :
    ```bash
    cd backend
    npm install
    cd ..
    ```
3.  Installez les dépendances pour le frontend :
    ```bash
    cd frontend
    npm install
    cd ..
    ```

## Lancement

1.  Lancez le serveur backend (depuis le dossier `backend/`) :
    ```bash
    cd backend
    npm start
    ```
    Le serveur écoutera sur `http://localhost:3001`.

2.  Lancez le serveur de développement frontend (depuis le dossier `frontend/`) dans un autre terminal :
    ```bash
    cd frontend
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:5173` (ou un autre port indiqué par Vite).

## Fonctionnalités réalisées

- UI moderne : affichage en cartes, responsive, modals, boutons flottants homogènes
- Sidebar avec logo et branding personnalisés
- Gestion des Programmes, Épisodes, Sujets (CRUD complet)
- Gestion des Médias (texte, vidéo YouTube) associés aux sujets
- Prévisualisation des vidéos YouTube
- Édition inline du contenu texte
- Upload de logos personnalisés pour chaque programme
- WebSocket temps réel (socket.io) : notifications, synchronisation live
- Gestion et synchronisation des scènes (Scene) : API REST + WebSocket
- Pilotage live multi-clients, feedback instantané (snackbar/notifications)
- Footer OBS optimisé (hauteur réduite, boutons verticaux, statut WebSocket sous l’aperçu)
- Sidebar épurée (devtools regroupés, accès rapide OBS)
- Roadmap détaillée et structurée (frontend/backend)
- Préparation d’un espace central pour l’émission/sujet dans le footer
- Navigation plus claire et interface allégée
- Correction et relance des serveurs, WebSocket fonctionnel
- Nettoyage du README

## Titrage OBS (Lower Third)

Le composant `LowerThird` assure un affichage professionnel du titrage (bandeau bas) dans l’aperçu OBS et la sortie principale :

- **Fidélité broadcast** : le rendu est identique dans la miniature et la sortie principale.
- **Bandeau adaptatif** : occupe toute la largeur du cadre vidéo, collé en bas, hauteur variable selon le texte.
- **Retour à la ligne automatique** : aucun mot n’est coupé, même pour des titres très longs.
- **Personnalisation facile** : modifiez `frontend/src/components/LowerThird.jsx` pour ajuster couleur, taille, padding, bordures, etc.
- **Effet professionnel** : fond sombre, texte blanc, bordures haut/bas, padding broadcast.

**Exemple d’intégration :**
```jsx
import LowerThird from './LowerThird';
...
<LowerThird title={current.title} />
```

Le composant est utilisé à la fois dans `ObsOutput.jsx` (sortie principale) et dans `ObsPreview.jsx` (miniature), garantissant un rendu cohérent partout.

## Roadmap

### Frontend : Overlays, UI/UX & Fonctionnalités
- Afficher l'émission et le sujet en cours dans le footer (zone centrale)
- Personnalisation du lower third (transition, police d'écriture, etc.)
- Effet d'apparition/disparition personnalisable pour les médias
- Modifier la position du logo de l'émission et personnalisation (effet flottement, glitch, etc.)
- Améliorations UI/UX : drag & drop médias plus robuste, filtres/sort sur les programmes, etc.
- Suggestions ou besoins à discuter au fil du projet
- Synchronisation des overlays OBS : permettre aux boutons du footer de contrôler à distance toutes les pages OBS ouvertes (media/titrage) via un canal de communication.
- Tests automatisés (unitaires backend, intégration frontend)
- Settings avancés / gestion des utilisateurs (profils, droits, personnalisation)

### Backend & API
- Logger avancé côté backend (et affichage admin optionnel)
- Documentation API interactive (Swagger UI sur /api-docs)
- Refonte/optimisation du backend (si besoin de persistance durable)

### Déploiement & Infrastructure

#### Solutions gratuites ou à coût nul pour héberger backend/frontend

- **Local avec accès distant** :
  - PC personnel (Windows/Linux/Mac) : ouvrir les ports sur la box/routeur pour accès distant.
  - Tunnel temporaire (ngrok, LocalTunnel, Cloudflare Tunnel) : expose ton serveur local via une URL publique, pratique pour la démo/test.
  - Avantage : aucun coût, contrôle total. Inconvénient : sécurité à gérer, dépend de ta connexion.
- **Cloud gratuit** :
  - Backend Node.js : Render, Railway, Cyclic, Glitch, Heroku (limité).
  - Frontend (build statique) : Netlify, Vercel, GitHub Pages.
  - Avantage : accès distant, pas besoin de PC allumé. Inconvénient : ressources limitées, endormissement possible.
- **VPS gratuits/éducation** :
  - Oracle Cloud Free Tier : petit VPS Linux gratuit, contrôle total, config plus technique.

**Conclusion rapide**
- Pour test : PC local + tunnel.
- Pour démo : Render/Railway (backend) + Netlify/Vercel (frontend).
- Pour usage sérieux : VPS gratuit ou serveur local bien sécurisé.

#### Spécifications minimales recommandées

- CPU : 1 cœur moderne (Intel/AMD ou ARM type Raspberry Pi 3+)
- RAM : 512 Mo à 1 Go
- Stockage : 1 Go libre (plus si beaucoup de médias)
- OS : Windows, Linux ou MacOS (Node.js et npm installés)
- Connexion : ADSL/VDSL/4G minimum (montant ≥ 1 Mbps recommandé)
- Sécurité : firewall, ports ouverts uniquement, HTTPS conseillé

_Un Raspberry Pi 3/4 suffit pour du dev ou une petite prod._

#### Utiliser un Raspberry Pi, un vieux PC ou un serveur Proxmox comme serveur

- Un Raspberry Pi 3 (ou supérieur) suffit pour héberger le backend Node.js et servir le frontend à quelques utilisateurs (contrôle, affichage, pilotage, streaming YouTube côté client).
- Un vieux PC (même dual-core, 2 Go RAM) sous Linux ou Windows fait aussi très bien l’affaire pour héberger le projet.
- **Intégration sur un serveur Proxmox** :
  - Crée une VM ou un conteneur LXC (Debian/Ubuntu recommandé) dédié à Girr Remake.
  - Alloue 1 à 2 Go de RAM, 1 à 2 vCPU (même un CPU bas de gamme suffit pour Node.js/React).
  - Installe Node.js, npm, et (optionnel) nginx pour servir le frontend buildé.
  - Tu peux monter un partage OpenMediaVault dans la VM/CT pour stocker les médias.
  - Girr Remake peut cohabiter sur le même serveur avec d'autres stacks/services (ex : Home Assistant, autres applications domotiques ou médias) sans problème, chaque service étant isolé dans sa propre VM ou conteneur.
- Pour l’accès distant au frontend/backend :
  - **Ouvrir les ports sur la box/routeur** (redirection du port 80 ou 5173 vers l’IP locale du Pi/PC/VM).
  - **Utiliser un tunnel gratuit** (Cloudflare Tunnel, ngrok, LocalTunnel) : expose le serveur local via une URL publique sécurisée, sans toucher à la box.
    - Ex : `cloudflared tunnel --url http://localhost:80` (voir doc Cloudflare Tunnel)
  - **VPN maison** (Zerotier, Tailscale, Wireguard) : accès sécurisé à ton réseau local depuis l’extérieur.
- Pour de meilleures performances sur le Pi ou en VM, utilise le build statique du frontend (`npm run build` puis `serve dist`).
- Sécurise la machine : firewall, mots de passe forts, désactive SSH root.

---

## Déploiement automatique (CI/CD) sur le cloud

Le projet inclut des fichiers de configuration pour automatiser le déploiement du frontend et du backend sur différentes plateformes cloud populaires :

- **Render** (`render.yaml` à la racine) : déploie automatiquement le backend (Node.js) et le frontend (buildé puis servi en statique) sur [Render.com](https://render.com). Il suffit de connecter le repo GitHub à Render, il détecte le fichier et crée les services.
- **Railway** (`railway.json` dans `frontend/` et `backend/`) : permet de déployer séparément le frontend et le backend sur [Railway.app](https://railway.app). Importe le repo sur Railway, sélectionne le dossier à builder (frontend ou backend).
- **Vercel** (`vercel.json` dans `frontend/`) : déploie le frontend statique sur [Vercel.com](https://vercel.com). Connecte le repo GitHub, Vercel détecte le fichier et build automatiquement le projet.
- **Netlify** (`netlify.toml` dans `frontend/`) : déploie le frontend statique sur [Netlify.com](https://netlify.com). Connecte le repo, Netlify lit le fichier et build le projet.

### Comment déployer ?

1. **Pousse le projet sur GitHub (ou autre gestionnaire de sources)**
2. **Sur la plateforme choisie (Render, Railway, Vercel, Netlify) :**
   - Crée un nouveau projet/site
   - Connecte ton repo
   - La plateforme détecte automatiquement le fichier de config et lance le build/déploiement
   - (Sur Render/Railway, configure les variables d’environnement si besoin)

> Pour le backend Node.js, privilégie Render ou Railway.
> Pour le frontend statique (build Vite/React), privilégie Netlify ou Vercel.

**Avantage :** tout est automatisé, pas besoin de scripts ou de configuration manuelle supplémentaire.

### Autres plateformes (Glitch, Cyclic, Heroku…)

Le dépôt contient aussi des fichiers pour automatiser le déploiement du frontend sur d’autres plateformes gratuites :

- **Heroku** (`frontend/heroku.yml`) :
  - Permet de builder et servir le frontend en mode statique via Docker sur Heroku.
  - Procédure : crée une nouvelle app Heroku, connecte le repo GitHub, Heroku détecte le fichier et build l’app.
- **Glitch** (`frontend/glitch-start.sh`) :
  - Script de démarrage pour builder puis servir le frontend sur Glitch.
  - Procédure : importe le dossier frontend sur Glitch, configure le script comme commande de démarrage.
- **Cyclic** (`frontend/cyclic.json`) :
  - Décrit les commandes de build et de start pour Cyclic.sh.
  - Procédure : importe le repo sur Cyclic, sélectionne le dossier frontend, Cyclic détecte le fichier et build automatiquement.

Pour chaque plateforme, il suffit généralement de :
1. Pousser le projet sur GitHub
2. Connecter le repo à la plateforme
3. Laisser la plateforme détecter le fichier de config et lancer le build

> Pour le backend Node.js, privilégie Render ou Railway (voir plus haut).

---
