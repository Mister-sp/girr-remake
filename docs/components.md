# Composants React

## Hooks personnalisés

### useTheme
Hook pour la gestion du thème.
- Accès aux couleurs personnalisées
- Mise à jour du thème
- Réinitialisation des couleurs par défaut
- Persistance des préférences

### usePerformance
Hook pour les optimisations de performance.
- Debounce des mises à jour d'état fréquentes
- Cache pour les calculs coûteux
- Throttle des appels WebSocket
- Détection des appareils moins puissants

### useToast
Hook pour le système de notifications.
- Affichage de toasts informatifs
- Support de différents types (success, error, etc.)
- Auto-destruction configurable
- Styles prédéfinis

### useKeyBindings
Hook pour la gestion des raccourcis clavier.
- Configuration personnalisable 
- Persistance des préférences
- Raccourcis par défaut pour la navigation
- Sensible au contexte (preview/live)

## Providers

### PerformanceProvider
Provider pour les optimisations de performance.
- Context pour les méthodes d'optimisation
- Détection des capacités du device
- Adaptation des animations
- Gestion de la réduction de mouvement

### ToastProvider
Provider pour le système de notifications.
- Gestion de la file de toasts
- Positionnement configurable
- Animation des notifications
- Support du multi-fenêtres

## Composants principaux

### ObsOutput
Gère l'affichage principal pour OBS.
- Affiche les médias et le lower third
- Gère les transitions et effets
- Supporte le mode preview/live

### LowerThird
Composant de titrage personnalisable.
- Supporte différentes polices
- Effets de transition configurables
- Position et style ajustables
- Support du logo programme

### PresenterView
Vue principale pour le présentateur.
- Navigation entre les sujets
- Gestion des médias
- Mode régie (grille)
- Notes en temps réel
- Preview OBS intégré

### ProgramList
Liste des programmes avec gestion.
- Ajout/modification/suppression
- Configuration du lower third
- Gestion des logos
- Effets de transition

## Composants utilitaires

### Modal
Composant modal réutilisable.
- Focus trap pour accessibilité
- Fermeture par Escape
- Animation de transition
- Support mobile

### ThemeProvider
Gestion du thème de l'application.
- Mode clair/sombre
- Synchronisation avec les préférences système
- Variables CSS personnalisées

### StatusBar
Barre d'état en bas de l'interface.
- État des connexions WebSocket
- Preview OBS miniature
- Compteur de clients
- Accès rapide aux fenêtres OBS

## Contextes React

### KeyBindingsContext
Gestion des raccourcis clavier.
- Configuration personnalisable
- Shortcuts globaux
- Documentation intégrée

### ThemeContext
Contexte pour le thème.
- Toggle thème
- Préférences utilisateur
- Persistance

## Styles et effets

### Effets de transition
Les effets disponibles pour les médias et logos :
- `fade` : Fondu simple
- `slide` : Glissement avec direction configurable
- `scale` : Mise à l'échelle avec zoom
- `flip` : Retournement avec angle personnalisable
- `none` : Pas d'animation

### Effets de logo
Effets spéciaux pour les logos :
- `float` : Flottement doux
- `glitch` : Effet glitch avec intensité réglable
- `pulse` : Pulsation avec opacité
- `oldtv` : Effet TV vintage
- `vhs` : Distortion VHS

### CSS modules et thèmes
Styles modulaires pour une meilleure maintenabilité :
- `modern-ui.css` : Base UI moderne
- `modern-layout.css` : Layout responsive
- `theme.css` : Variables de thème
- `media-effects.css` : Animations des médias
- `logo-effects.css` : Effets des logos
- `toasts-and-modal.css` : Styles des notifications

## Performance et optimisations

### Lazy loading
Chargement différé des composants :
- Split code par routes
- Lazy import des modales
- Code-splitting des plugins
- Préchargement intelligent

### Optimisations de rendu
Stratégies d'optimisation :
- Virtualisation des longues listes
- debounce/throttle des événements
- Mise en cache des calculs coûteux
- Memoization des composants

### Media loading
Optimisation du chargement des médias :
- Préchargement des images
- Lazy loading des iframes YouTube
- Placeholder pendant le chargement
- Gestion des erreurs de chargement

## Accessibilité

### Keyboard navigation
Support complet du clavier :
- Navigation par tab logique
- Raccourcis configurables
- Focus visible et distinct
- Skip links

### Screen readers
Support des lecteurs d'écran :
- ARIA landmarks et labels
- Description des images
- États dynamiques
- Messages de statut

### Responsive design
Adaptation aux différents devices :
- Layout fluide
- Contrôles adaptés au touch
- Détection des préférences
- Mode réduit en mouvement

## Communication temps réel

### WebSocket
Gestion des connexions en temps réel :
- Synchronisation multi-fenêtres
- Statut des clients connectés
- Reconnexion automatique
- Mode fallback BroadcastChannel

### Types de clients
Différents types de clients supportés :
- `preview` : Mode prévisualisation
- `obs-output` : Sortie OBS complète
- `obs-media` : Sortie média uniquement
- `obs-titrage` : Sortie titrage uniquement

### Événements temps réel
Messages WebSocket supportés :
- `obs:update` : Mise à jour affichage OBS
- `client:register` : Enregistrement client
- `settings:update` : Mise à jour paramètres
- `preview:update` : Mise à jour preview

## Sauvegarde et restauration

### Système de backup
Configuration des sauvegardes :
- Backup automatique périodique
- Backup manuel à la demande
- Rotation des sauvegardes
- Limite configurable

### Format des données
Structure des fichiers de sauvegarde :
- Programmes et logos
- Episodes et sujets
- Médias et ressources
- Paramètres globaux

### Import/Export
Gestion des configurations :
- Export au format JSON
- Import avec validation
- Migration des données
- Gestion des conflits