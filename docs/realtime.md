# Synchronisation temps réel

## WebSocket

### Types de clients
- `obs` : Sorties OBS complètes (médias + titrage)
- `obs-media` : Sorties OBS médias uniquement
- `obs-titrage` : Sorties OBS titrage uniquement
- `control` : Interfaces de contrôle (navigateur)

### Événements

#### `obs:update`
Envoyé lors de :
- Changement de titre/sous-titre
- Affichage d'un média
- Modification du logo
- Changement d'effet de transition

Payload :
```javascript
{
  title?: string,
  subtitle?: string,
  media?: {
    type: 'image' | 'youtube' | 'url',
    url: string
  },
  logoUrl?: string,
  logoEffect?: string,
  logoPosition?: string,
  logoSize?: number
}
```

#### `settings:transitions:update`
Envoyé lors de la modification des paramètres de transition.

Payload :
```javascript
{
  appearEffect: string,
  disappearEffect: string,
  duration: number,
  timing: string,
  slideDistance: number,
  zoomScale: number,
  rotateAngle: number
}
```

#### `clients:update`
Envoyé lors de la connexion/déconnexion d'un client.

Payload :
```javascript
{
  obsViewers: number,
  controlViewers: number
}
```

## BroadcastChannel

Utilisé pour la synchronisation entre onglets du navigateur :

### `obs-sync`
Synchronise :
- État des sorties OBS
- Preview dans le footer
- État des contrôles
- Titrage actif