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

## Fonctionnalités (en cours)

-   Gestion des Programmes, Épisodes, Sujets.
-   Gestion des Médias (Texte, Vidéo YouTube) associés aux Sujets.
-   Prévisualisation des vidéos YouTube.
-   Édition inline du contenu texte.
-   Réorganisation par glisser-déposer des médias (Sauvegarde de l'ordre en cours de débogage).
