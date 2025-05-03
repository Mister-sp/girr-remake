# Documentation des fonctionnalités de FREMEN

Ce document détaille le comportement normal attendu de toutes les fonctionnalités actuelles de FREMEN.

## Interface utilisateur

### Thème & Apparence
- Le thème par défaut s'aligne sur les préférences système (clair/sombre)
- Le basculement de thème est possible via:
  - Le bouton dans la sidebar
  - Le raccourci clavier 'D'
- La préférence de thème est sauvegardée dans localStorage
- La transition entre thèmes utilise une animation fluide de 0.3 secondes

### Navigation & Sidebar
- La sidebar reste visible en permanence sur desktop (largeur > 768px)
- Sur mobile, la sidebar se transforme en menu hamburger
- Les éléments actifs de la navigation sont mis en évidence
- Les badges numériques indiquent le nombre d'éléments (programmes, épisodes)
- Le logo principal est cliquable et ramène à l'accueil

### Raccourcis clavier
- '?' ouvre le modal d'aide avec tous les raccourcis disponibles
- 'L' accède directement aux paramètres
- 'D' bascule entre thème clair et sombre
- Flèches gauche/droite pour navigation entre sujets en mode présentateur
- 'Esc' ferme les modals ouverts
- Ces raccourcis sont disponibles sur toutes les pages, sauf dans les champs de texte

## Gestion de contenu

### Programmes
- Ajout de programmes avec nom, description et logo optionnel
- Modification et suppression disponibles avec confirmation
- Les logos peuvent être téléchargés (formats acceptés: PNG, JPG, SVG, < 2MB)
- La suppression d'un programme supprime en cascade tous ses épisodes et sujets
- L'affichage se fait en grille avec 3 colonnes sur desktop, 1 sur mobile
- Chaque carte de programme affiche: nom, description tronquée, logo, nombre d'épisodes

### Épisodes
- Création liée à un programme spécifique
- Champs disponibles: titre, date, description
- Navigation intuitive entre les épisodes d'un même programme
- Affichage triable par date (récent/ancien)
- Le badge sur chaque carte indique le nombre de sujets

### Sujets
- Association à un épisode spécifique
- Champs: titre, description, notes internes
- Possibilité d'associer des médias (voir section suivante)
- Réordonnancement par drag & drop
- Chaque sujet peut être marqué comme "traité" visuellement
- Interface optimisée pour l'utilisation en direct

### Médias
- Types supportés:
  - Texte simple
  - URL YouTube (avec prévisualisation)
  - Vidéos locales (formats MP4, WebM)
  - Images (formats PNG, JPG, SVG)
- Prévisualisation intégrée pour tous les types
- Options de redimensionnement pour les images
- Contrôles pour vidéo YouTube (lecture/pause, volume)
- Enregistrement automatique des modifications

## OBS & Output

### Lower Third (titrage)
- Affichage fluide du texte avec animation d'apparition/disparition (slide)
- Adaptation automatique à la longueur du texte
- Multi-lignes avec retour automatique
- Respect strict des styles définis (police, couleurs)
- Le lower third apparaît/disparaît instantanément via les contrôles
- Position fixe en bas de l'écran

### ObsPreview
- Aperçu en temps réel du rendu OBS
- Maintien du ratio 16:9
- Mise à jour synchronisée avec toute modification
- Échelle réduite mais fidèle au rendu final
- Accessible depuis toutes les vues principales

### Contrôle des médias
- Boutons dédiés pour afficher/masquer les médias
- Contrôle indépendant du titrage et des médias
- Transitions configurées appliquées automatiquement
- Feedback visuel de l'état actuel (affiché/masqué)

## Mode présentateur

### Vue en grille
- Affichage de tous les sujets d'un épisode en grille
- Mise en évidence du sujet actif
- Indicateurs visuels des médias associés par type
- Navigation rapide entre sujets via clic ou raccourcis clavier
- Boutons d'action rapide par sujet

### Aperçu intégré
- Aperçu OBS intégré directement dans l'interface
- Position fixe en bas de l'écran
- Affichage en temps réel des modifications
- Indicateurs de statut (médias visibles, titrage actif)

### Notes en temps réel
- Modification des notes par sujet sans quitter l'écran
- Sauvegarde automatique des modifications
- Formatage simple du texte supporté
- Visibilité uniquement dans l'interface, pas dans l'output OBS

## Système de backup

### Sauvegardes automatiques
- Exécution périodique selon intervalle configuré (minimum 30 minutes)
- Format de fichier: JSON horodaté
- Stockage dans `backend/data/backups/`
- Rotation automatique selon le paramètre de conservation
- Aucune interruption du service lors des sauvegardes

### Restauration
- Interface dédiée dans les paramètres
- Liste chronologique des sauvegardes disponibles
- Prévisualisation du contenu avant restauration
- Confirmation obligatoire avant restauration
- Création automatique d'une sauvegarde de l'état actuel avant restauration

### Récupération d'urgence
- Système de fallback progressif:
  1. Tentative avec store.json principal
  2. Repli sur store.json.backup
  3. Utilisation du backup le plus récent
  4. Notification explicite en cas d'échec complet

## Synchronisation temps réel

### WebSocket
- Connexion établie automatiquement au chargement de l'application
- Reconnexion automatique en cas de perte de connexion
- Indicateur visuel de l'état de connexion dans la barre de statut
- Synchronisation bidirectionnelle des modifications
- Optimisation avec compression pour réduire la bande passante

### Multi-clients
- Support jusqu'à 100 connexions simultanées
- Affichage du nombre de clients connectés
- Synchronisation immédiate des actions entre tous les clients
- Aucune collision de données grâce au système de locks implicites
- Notification lorsqu'une modification est reçue d'un autre client

## Authentification & Sécurité

### Connexion utilisateur
- Page de login simple avec nom d'utilisateur et mot de passe
- Token JWT stocké dans localStorage
- Durée de validité du token: 24 heures
- Redirection automatique vers login si token expiré/invalide
- Protection de toutes les routes API et WebSocket

### Sécurisation des données
- Hachage des mots de passe avec bcrypt (10 rounds)
- Protection contre les injections grâce à la validation des données
- Rate limiting sur les routes sensibles (login: 5 tentatives/minute)
- Chiffrement AES-256 pour les données sensibles stockées
- Sanitization de toutes les entrées utilisateur

## Paramètres système

### Configuration générale
- Interface unifiée dans la section "Paramètres"
- Sauvegarde automatique des modifications
- Options organisées par catégories (Interface, Backup, Sécurité)
- Validation des entrées en temps réel
- Valeurs par défaut prédéfinies pour toutes les options

### Import/Export
- Export complet au format JSON
- Validation complète des données importées
- Gestion automatique des conflits d'ID
- Support de la migration depuis l'ancien format GIRR
- Prévisualisation et confirmation avant application

## Barre de statut

### Indicateurs en temps réel
- État de connexion au serveur WebSocket (vert/rouge)
- Nombre de clients connectés avec badge numérique
- Indicateurs OBS (titrage actif/inactif, média affiché/masqué)
- Boutons d'accès rapide aux fenêtres OBS
- Position fixe en bas de l'interface, toujours visible

## Performances

### Optimisations frontend
- Lazy loading des composants non critiques
- Mise en cache des données fréquemment accédées
- Throttling des appels WebSocket (100ms)
- Suspension des animations en arrière-plan
- Compression des images uploadées côté client

### Optimisations backend
- Pagination intelligente des résultats (20 éléments par défaut)
- Mise en cache avec node-cache (TTL: 5 minutes)
- Compression gzip des réponses HTTP
- Index en mémoire pour les recherches fréquentes
- Rate limiting par IP (100 requêtes/minute)

## Workflows types

Cette section présente des exemples de workflows complets pour les cas d'utilisation les plus courants de FREMEN.

### Préparation et diffusion d'un nouvel épisode

#### 1. Configuration initiale (avant le stream)
1. **Créer un nouveau programme** (si ce n'est pas déjà fait)
   - Accéder à la page d'accueil
   - Cliquer sur "Ajouter un programme"
   - Remplir le formulaire avec nom, description et logo
   - Valider avec "Créer le programme"

2. **Créer un nouvel épisode**
   - Depuis la page du programme, cliquer sur "Nouvel épisode"
   - Remplir le titre, la date et la description
   - Valider avec "Créer l'épisode"

3. **Ajouter les sujets prévus**
   - Depuis la page de l'épisode, cliquer sur "Ajouter un sujet"
   - Remplir le titre et la description pour chaque sujet
   - Pour ajouter des médias à un sujet:
     - Cliquer sur l'icône "média" du sujet
     - Choisir le type de média (YouTube, image, vidéo locale)
     - Ajouter l'URL ou télécharger le fichier
   - Réorganiser les sujets par drag & drop si nécessaire
   - Ajouter des notes internes pour l'équipe

4. **Configurer OBS**
   - Ouvrir OBS Studio
   - Créer des sources de type "Navigateur"
     - Pour le lower third: `http://localhost:3001/obs/lower-third`
     - Pour les médias: `http://localhost:3001/obs/media`
   - Régler la taille des sources selon vos besoins
   - Ajouter ces sources aux scènes appropriées

#### 2. Pendant le stream
1. **Passer en mode présentateur**
   - Cliquer sur l'icône "présentateur" depuis la page de l'épisode
   - L'interface passe en mode sombre optimisé pour la diffusion

2. **Navigation entre les sujets**
   - Cliquer sur un sujet pour l'activer (il sera mis en surbrillance)
   - Utiliser les flèches gauche/droite du clavier pour naviguer
   - Marquer les sujets comme "traités" au fur et à mesure

3. **Afficher le titrage**
   - Quand un sujet est sélectionné, cliquer sur le bouton "Afficher titrage"
   - Le lower third apparaît avec animation dans OBS
   - Pour le masquer, cliquer à nouveau sur le bouton

4. **Afficher les médias**
   - Sélectionner un sujet contenant des médias
   - Cliquer sur le bouton "Afficher média"
   - Le média apparaît avec la transition configurée dans OBS
   - Pour masquer le média, cliquer à nouveau sur le bouton

5. **Ajouter des notes en temps réel**
   - Cliquer dans la zone de notes d'un sujet
   - Ajouter ou modifier les notes pendant la diffusion
   - Les notes sont sauvegardées automatiquement

#### 3. Après le stream
1. **Export des données** (optionnel)
   - Accéder aux paramètres via le bouton "L" ou la sidebar
   - Aller dans la section Export/Import
   - Cliquer sur "Exporter les données"
   - Sauvegarder le fichier JSON généré

2. **Vérification des sauvegardes**
   - Vérifier que la sauvegarde automatique s'est bien exécutée
   - La dernière sauvegarde doit apparaître dans la liste des backups

### Migration depuis GIRR

1. **Exporter les données de GIRR**
   - Dans GIRR, accéder aux paramètres
   - Cliquer sur "Exporter les données"
   - Sauvegarder le fichier JSON

2. **Importer dans FREMEN**
   - Dans FREMEN, accéder aux paramètres
   - Aller dans la section "Import/Export"
   - Cliquer sur "Importer des données"
   - Sélectionner le fichier JSON exporté depuis GIRR
   - Vérifier l'aperçu des données
   - Confirmer l'import

3. **Vérification post-migration**
   - Vérifier que tous les programmes sont présents
   - Vérifier que les épisodes et sujets sont correctement associés
   - Tester l'affichage des médias importés
   - Ajuster les paramètres si nécessaire

### Configuration multi-postes

1. **Installation sur le poste principal**
   - Installer FREMEN selon les instructions standard
   - Configurer complètement l'application (programmes, épisodes, etc.)

2. **Configuration des postes secondaires**
   - Installer FREMEN sur les postes secondaires
   - S'assurer que tous les postes sont sur le même réseau local
   - Sur chaque poste secondaire:
     - Dans le fichier `.env` du frontend, définir `VITE_API_URL` avec l'IP du serveur principal
     - Exemple: `VITE_API_URL=http://192.168.1.100:3001`

3. **Test de synchronisation**
   - Sur le poste principal, créer ou modifier un élément
   - Vérifier que la modification apparaît sur les postes secondaires
   - Vérifier que la barre de statut indique bien les clients connectés

## Dépannage

Cette section présente les problèmes les plus fréquemment rencontrés et leurs solutions.

### Problèmes de connexion

| Problème | Causes possibles | Solutions |
|----------|-----------------|-----------|
| **Erreur "Connexion au serveur impossible"** | • Serveur backend non démarré<br>• Mauvaise URL du backend | • Vérifier que le serveur backend est en cours d'exécution<br>• Vérifier la variable d'environnement `VITE_API_URL` du frontend<br>• Vérifier que le port 3001 est disponible et non bloqué par un firewall |
| **Déconnexions intermittentes WebSocket** | • Instabilité réseau<br>• Timeout du serveur | • Vérifier la connexion réseau<br>• Augmenter la valeur de `pingTimeout` dans `backend/websocket.js`<br>• Réduire le délai de reconnexion dans `frontend/src/services/websocket.js` |
| **Page de login en boucle** | • Token JWT expiré ou invalide<br>• Problème de localStorage | • Vider le cache du navigateur<br>• Supprimer manuellement les entrées localStorage de FREMEN<br>• Vérifier la configuration dans `backend/config/auth.js` |

### Problèmes OBS

| Problème | Causes possibles | Solutions |
|----------|-----------------|-----------|
| **Médias invisibles dans OBS** | • URL incorrecte<br>• Source navigateur mal configurée | • Vérifier l'URL des sources navigateur OBS<br>• Assurer que l'URL pointe vers `http://<server>:3001/obs/media`<br>• Actualiser la source navigateur (clic droit > Actualiser)<br>• Activer "Actualiser la source lorsqu'elle devient active" dans OBS |
| **Lower third ne s'affiche pas** | • Problème de CSS<br>• Source navigateur mal configurée | • Vérifier que l'URL pointe vers `http://<server>:3001/obs/lower-third`<br>• Actualiser la source navigateur<br>• Vérifier dans les DevTools que le CSS est correctement chargé |
| **Animations saccadées** | • Performance CPU insuffisante<br>• Conflits avec d'autres sources | • Réduire les effets de transition dans les paramètres<br>• Désactiver l'option "Filtrer la source lorsqu'inactive" dans OBS<br>• Vérifier la charge CPU pendant la diffusion |

### Problèmes de données

| Problème | Causes possibles | Solutions |
|----------|-----------------|-----------|
| **Perte de données** | • Fichier store.json corrompu<br>• Problème lors d'une sauvegarde | • Utiliser la fonction de restauration dans Paramètres > Backups<br>• Vérifier les fichiers dans `backend/data/backups/`<br>• Restaurer manuellement store.json à partir d'une sauvegarde |
| **Import échoue** | • Format JSON invalide<br>• Structure de données incompatible | • Vérifier la validité du JSON importé<br>• Pour les imports depuis GIRR, utiliser l'option spécifique "Import GIRR"<br>• Essayer d'importer par sections (programmes puis épisodes) |
| **IDs en conflit** | • Import multiple des mêmes données<br>• Modification manuelle des IDs | • Réimporter en cochant "Régénérer les IDs"<br>• Nettoyer entièrement la base avant import<br>• Utiliser l'outil de résolution de conflits dans les paramètres |

### Problèmes d'interface

| Problème | Causes possibles | Solutions |
|----------|-----------------|-----------|
| **Interface non responsive** | • CSS non chargé correctement<br>• Fenêtre trop petite | • Actualiser la page<br>• Vérifier la taille minimale supportée (320px)<br>• Désactiver les extensions de navigateur qui peuvent interférer |
| **Drag & drop ne fonctionne pas** | • Conflit JavaScript<br>• Bug de rendu React | • Actualiser la page<br>• Vérifier la console pour des erreurs<br>• Essayer un autre navigateur pour isoler le problème |
| **Thème incorrect** | • localStorage corrompu<br>• Conflit avec préférences système | • Basculer manuellement le thème avec le bouton ou 'D'<br>• Effacer le localStorage et recharger<br>• Vérifier les préférences de thème du système |

### Performances

| Problème | Causes possibles | Solutions |
|----------|-----------------|-----------|
| **Application lente** | • Trop de données chargées<br>• Fuites mémoire | • Vérifier la taille de store.json<br>• Redémarrer le serveur backend<br>• Augmenter les limites de mémoire Node.js avec `--max-old-space-size=4096` |
| **Synchronisation lente** | • Payload WebSocket trop grand<br>• Réseau saturé | • Réduire la fréquence des mises à jour<br>• Augmenter la valeur de throttling dans `frontend/src/services/websocket.js`<br>• Vérifier la charge réseau entre clients |
| **Backend consomme trop de CPU** | • Trop de clients connectés<br>• Backup en cours | • Limiter le nombre de clients simultanés<br>• Augmenter l'intervalle des sauvegardes automatiques<br>• Optimiser les requêtes fréquentes |