# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]
### Ajouts et améliorations
- ObsPreview corrigé pour afficher correctement le preview dans le footer
- Gestion améliorée des médias dans le preview (disparition correcte)
- Correction des conflits de variables dans ObsOutput

### Corrections
- Résolution du bug d'affichage des médias dans le preview lors du changement de titre
- Correction de l'alignement du preview OBS dans le footer

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
