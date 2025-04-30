# Changelog

## [2025-04-23]

- Refonte du footer : réduction de la hauteur, suppression des éléments inutiles, organisation verticale des boutons OBS, statut WebSocket déplacé sous l’aperçu.
- Sidebar épurée : icônes OBS en accès rapide, liens de développement regroupés derrière un bouton "Dev".
- Ajout d’un espace central réservé dans le footer pour l’affichage futur de l’émission/sujet.
- Roadmap restructurée et enrichie dans le README, avec sous-thèmes frontend/backend.
- Amélioration de la clarté de la navigation et de l’ergonomie générale.
- Correction et relance des serveurs frontend/backend, vérification du fonctionnement WebSocket.
- Nettoyage du README (suppression des sections d’aperçu, roadmap réorganisée).

## [Unreleased]
### Ajouts et améliorations
- Harmonisation du branding FREMEN dans toute l’application (sidebar, README, logo, etc.)
- Correction et synchronisation du slogan (« Tel Shai-Hulud, maîtrisez le stream ») partout dans l’interface et la documentation
- Sidebar mise à jour avec le nouveau nom et le slogan
- Nettoyage du README et suppression des anciennes mentions/slogans

- Refonte UX de la liste des programmes :
  - Header sticky avec titre et bouton « + » d’ajout aligné à droite (flex).
  - Le bouton d’ajout ouvre un modal pour créer un programme.
  - Scrollbar parfaitement alignée à droite de la zone centrale.
  - Suppression des anciens boutons flottants redondants.
  - Utilisation de flexbox pour un alignement moderne, responsive et une UX améliorée.
- Personnalisation avancée du lower third (titrage) lors de la création et la modification de programme :
  - Choix police, taille, couleur, effet, fond, position et transitions directement dans le formulaire.

- Ajout d'un bouton dans la sidebar permettant d'ouvrir simultanément les overlays OBS Media (`/obs-media`) et Titrage (`/obs-titrage`) dans deux nouveaux onglets.
- Les boutons individuels « Aperçu OBS Media » et « Aperçu OBS Titrage » ont été retirés de la sidebar pour simplifier l'UI.
- Le footer permet toujours de prévisualiser dynamiquement l'un des overlays dans le mini-apercu intégré.
- Ajout à la roadmap du README : synchronisation avancée des overlays OBS (contrôle à distance via les boutons du footer).

- Implémentation de l'effet de fondu (fade) pour les transitions de médias dans l'overlay OBS
  - Effet de fondu fluide lors de l'apparition et la disparition des médias
  - Les autres effets de transition seront implémentés ultérieurement

### Corrections
- Nettoyage de la sidebar : suppression des liens redondants.

---

Pour consulter l'historique complet, voir les versions précédentes.
