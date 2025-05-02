# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Added
- Système de monitoring complet :
  - Dashboard temps réel sur `/status`
  - Métriques Prometheus sur `/metrics`
  - Healthcheck sur `/health`
  - Monitoring des connexions WebSocket
  - Compteurs pour les topics et médias
  - Métriques de performance HTTP
  - Logs structurés avec Morgan et Winston
- Containerisation complète de l'application avec Docker :
  - Configuration multi-conteneurs avec docker-compose
  - Conteneur frontend avec support hot-reload
  - Conteneur backend avec persistance des données
  - Volumes pour les backups et les logs
  - Documentation Docker dans le README
  - Ports exposés : 5173 (frontend) et 3001 (backend)
- Scripts d'installation et désinstallation automatisée :
  - Support Windows (PowerShell) et Linux/Mac (Bash)
  - Installation des dépendances frontend et backend
  - Configuration automatique des fichiers .env
  - Création des dossiers nécessaires
  - Configuration des hooks git
  - Désinstallation propre avec nettoyage complet
  - Scripts robustes avec gestion d'erreurs
  - Compatible avec les systèmes CI/CD

### Fixed
- Correction du mode sombre qui ne s'appliquait pas correctement sur la sidebar et la statusbar
- Uniformisation de l'implémentation du mode sombre à travers l'application
- Amélioration de la cohérence visuelle entre les différents composants en mode sombre

### Changed
- Modification de la classe CSS pour le mode sombre de `dark-theme` à `dark` pour une meilleure cohérence
- Optimisation des variables CSS pour le thème sombre

### Ajouts et améliorations
- Ajout de l'import depuis l'ancien GIRR (à tester) :
  - Conversion automatique du format ancien vers le nouveau
  - Import des programmes, épisodes, sujets et médias
  - Gestion des IDs pour éviter les conflits
  - Configuration par défaut des effets visuels
  - Interface dédiée dans les paramètres
  - Message de confirmation avec statistiques d'import
- Système de backup automatique configurable :
  - Configuration de l'intervalle entre les sauvegardes
  - Définition du nombre maximum de sauvegardes à conserver
  - Activation/désactivation des sauvegardes automatiques
  - Interface de gestion dans les paramètres
  - Rotation automatique des anciennes sauvegardes
  - Sauvegarde manuelle à la demande
- Refonte complète de l'interface de paramètres :
  - Renommage de LiveControl en Settings pour plus de clarté
  - Ajout d'une section export/import de configuration
  - Interface unifiée pour les paramètres globaux
  - Nouveau raccourci 'L' pour accéder aux paramètres
- Correction de la fonctionnalité d'export/import :
  - Export avec tous les paramètres (programmes, épisodes, sujets, médias, transitions)
  - Import avec validation des données
  - Gestion des IDs lors de l'import pour éviter les conflits
  - Headers de téléchargement corrigés
- Renommage de LiveControlFooter en StatusBar pour plus de clarté
- Export/Import des configurations complet
  - Export de toutes les données (programmes, épisodes, sujets, médias)
  - Import avec validation des données
  - Interface utilisateur dans les paramètres
  - Gestion des IDs lors de l'import
- Documentation API complète avec Swagger (interface interactive disponible sur /api-docs)
- Implémentation d'un système de logging avancé avec Winston
  - Logs séparés pour les erreurs et les informations générales
  - Format JSON pour une meilleure analyse
  - Niveaux de log configurables
- ObsPreview corrigé pour afficher correctement le preview dans le footer
- Gestion améliorée des médias dans le preview (disparition correcte)
- Correction des conflits de variables dans ObsOutput

### Corrections
- Résolution du bug d'affichage des médias dans le preview lors du changement de titre
- Correction de l'alignement du preview OBS dans le footer

## [2025-05-01]
### Ajouts
- Mode présentateur avancé :
  - Vue en grille (mode régie) avec accès rapide à tous les sujets
  - Liste des médias avec aperçu du type (images, vidéos, liens)
  - Navigation précédent/suivant pour les sujets
  - Notes par sujet
  - Raccourcis clavier personnalisables
  - Preview OBS intégrée
  - Interface sombre optimisée

### Optimisations
- Refonte complète du mode présentateur
- Amélioration de la gestion des médias
- Raccourcis clavier plus ergonomiques

## [2025-04-23]
### Ajouts et améliorations
- Harmonisation du branding FREMEN dans toute l'application (sidebar, README, logo, etc.)
- Correction et synchronisation du slogan (« Tel Shai-Hulud, maîtrisez le stream ») partout dans l'interface et la documentation
- Sidebar mise à jour avec le nouveau nom et le slogan
- Nettoyage du README et suppression des anciennes mentions/slogans

- Refonte UX de la liste des programmes :
  - Header sticky avec titre et bouton « + » d'ajout aligné à droite (flex)
  - Le bouton d'ajout ouvre un modal pour créer un programme
  - Scrollbar parfaitement alignée à droite de la zone centrale
  - Suppression des anciens boutons flottants redondants
  - Utilisation de flexbox pour un alignement moderne et responsive

- Personnalisation avancée du lower third (titrage) lors de la création et modification de programme :
  - Choix police, taille, couleur, effet, fond, position et transitions directement dans le formulaire

- Effet de fondu (fade) pour les transitions de médias dans l'overlay OBS :
  - Effet de fondu fluide lors de l'apparition et la disparition des médias
  - Architecture en place pour supporter d'autres effets de transition

### Optimisations
- Refonte du footer : réduction de la hauteur, organisation verticale des boutons OBS
- Sidebar épurée : icônes OBS en accès rapide, liens de développement regroupés
- Amélioration de la clarté de la navigation et de l'ergonomie générale
- Correction et relance des serveurs frontend/backend
- Vérification et optimisation du fonctionnement WebSocket

### Corrections
- Nettoyage de la sidebar et suppression des liens redondants
- Réorganisation de la roadmap dans le README
- Optimisation de l'affichage dans le footer

---

Pour consulter l'historique complet, voir les versions précédentes.
