# Sécurité dans FREMEN

Ce document décrit les mécanismes de sécurité implémentés dans FREMEN et comment les utiliser correctement.

## Table des matières

1. [Authentification et Autorisation](#authentification-et-autorisation)
2. [Chiffrement des données sensibles](#chiffrement-des-données-sensibles)
3. [Tokens API externes](#tokens-api-externes)
4. [Configuration de sécurité](#configuration-de-sécurité)
5. [Bonnes pratiques](#bonnes-pratiques)

## Authentification et Autorisation

### Système d'authentification

FREMEN utilise JWT (JSON Web Tokens) pour l'authentification des utilisateurs. Ce système permet :

- Une authentification sans état (stateless)
- Une expiration automatique des sessions
- Une protection des routes sensibles

### Configuration

Les paramètres d'authentification sont définis dans `backend/config/auth.js` :

```javascript
module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'votre-secret-temporaire-a-changer-en-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    defaultUser: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin',
    }
};
```

⚠️ **Important** : En production, définissez toujours les variables d'environnement `JWT_SECRET`, `ADMIN_USERNAME` et `ADMIN_PASSWORD` !

### Middleware d'authentification

Toutes les routes sensibles de l'API sont protégées par le middleware `authenticateToken` qui vérifie la validité du token JWT fourni dans l'en-tête `Authorization`.

### Rate limiting

Un système de limitation des tentatives de connexion est implémenté pour prévenir les attaques par force brute :

- Maximum 5 tentatives de connexion en 15 minutes
- Blocage temporaire après dépassement de la limite

## Chiffrement des données sensibles

### Module de chiffrement

Le module `backend/config/encryption.js` fournit les fonctionnalités de chiffrement/déchiffrement AES-256 :

```javascript
// Chiffrer une donnée sensible
const encryptedData = encryption.encrypt(sensitiveData);

// Déchiffrer une donnée
const decryptedData = encryption.decrypt(encryptedData);

// Générer un hash non réversible
const hashedValue = encryption.hash(data);
```

### Clé de chiffrement

Par défaut, une clé de chiffrement temporaire est utilisée. Pour la production, définissez la variable d'environnement `ENCRYPTION_KEY` avec une valeur forte et aléatoire.

### Données protégées

Les données suivantes sont actuellement chiffrées :

1. Mots de passe OBS dans les paramètres
2. Tokens d'API pour services externes

## Tokens API externes

### Stockage sécurisé

Les tokens d'API pour services externes (YouTube, Twitch, etc.) sont stockés de manière chiffrée via le modèle `apiTokens`.

### API de gestion des tokens

Une API REST est disponible pour gérer ces tokens de manière sécurisée :

- `GET /api/tokens` : Liste les services avec tokens (sans exposer les tokens)
- `POST /api/tokens/:service` : Stocke un token pour un service spécifique
- `GET /api/tokens/:service/status` : Vérifie l'existence d'un token pour un service
- `DELETE /api/tokens/:service` : Supprime un token

### Exemple d'utilisation (frontend)

```javascript
// Ajouter un token pour YouTube
const youtubeToken = { access_token: 'abc123', refresh_token: 'xyz789', expires_at: 1620000000 };
await axios.post('/api/tokens/youtube', youtubeToken);

// Vérifier si un token existe
const status = await axios.get('/api/tokens/youtube/status');
console.log(status.data.exists); // true ou false
```

### Exemple d'utilisation (backend)

```javascript
const apiTokens = require('../models/apiTokens');

// Récupérer un token déchiffré
const youtubeToken = apiTokens.getApiToken('youtube');
if (youtubeToken) {
    // Utiliser le token pour appeler l'API YouTube
}
```

## Configuration de sécurité

### Variables d'environnement

Pour une sécurité optimale, définissez ces variables d'environnement en production :

```
JWT_SECRET=un-secret-long-aleatoire-et-complexe
JWT_EXPIRATION=24h
ADMIN_USERNAME=votre-nom-utilisateur
ADMIN_PASSWORD=votre-mot-de-passe-fort
ENCRYPTION_KEY=une-cle-de-chiffrement-forte-et-aleatoire
```

### Serveur sécurisé

En production, nous recommandons de :

1. Utiliser HTTPS
2. Configurer les en-têtes de sécurité (Helmet)
3. Activer CORS avec des origines restreintes
4. Mettre en place un proxy inverse (Nginx, Caddy)

## Bonnes pratiques

1. **Changez immédiatement les identifiants par défaut** après la première installation
2. **Utilisez des mots de passe forts** (12+ caractères, mélange de lettres, chiffres, symboles)
3. **Ne partagez jamais les clés de sécurité** dans les dépôts de code ou les logs
4. **Surveillez régulièrement les journaux d'activité** pour détecter les tentatives d'intrusion
5. **Limitez les informations de débogage** en production
6. **Mettez à jour régulièrement l'application** pour bénéficier des correctifs de sécurité

---

Pour toute question ou préoccupation de sécurité, veuillez contacter l'équipe de développement.