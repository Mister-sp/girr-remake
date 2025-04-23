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

## Roadmap / À faire

---

## Aperçu de l'interface

Voici quelques captures d'écran de l'interface utilisateur :

### Sidebar avec bouton d'ouverture simultanée des overlays OBS

![Sidebar Aperçu OBS](frontend/public/sidebar-apercu.png)

### Footer avec mini-apercu OBS et boutons de sélection dynamique

![Footer Aperçu OBS](frontend/public/footer-apercu.png)

> Pour ajouter vos propres captures d'écran : placez vos fichiers PNG/JPG dans `frontend/public/` puis modifiez les liens ci-dessus si besoin.

- Logger avancé côté backend (et affichage admin optionnel)
- Documentation API interactive (Swagger UI sur /api-docs)
- Synchronisation des overlays OBS : permettre aux boutons du footer de contrôler à distance toutes les pages OBS ouvertes (media/titrage) via un canal de communication.
- Tests automatisés (unitaires backend, intégration frontend)
- Settings avancés / gestion des utilisateurs (profils, droits, personnalisation)
- Améliorations UI/UX : drag & drop médias plus robuste, filtres/sort sur les programmes, etc.
- Refonte/optimisation du backend (si besoin de persistance durable)
- Suggestions ou besoins à discuter au fil du projet
