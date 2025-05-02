# Système de stockage

## Structure

Le système utilise un stockage JSON simple mais robuste, organisé dans `/backend/data/`:

### store.json
Fichier principal contenant :
- Les programmes
- Les épisodes
- Les sujets (topics)
- Les médias
- Les paramètres globaux

### Backups automatiques

Le système de backup est configurable via l'API et l'interface :
- Intervalle configurable (minimum 30 minutes)
- Nombre de backups conservés paramétrable
- Rotation automatique des anciennes sauvegardes
- Format de nom: `backup-YYYY-MM-DDThh-mm-ss-mmmZ.json`

## Validation des données

Les données sont validées à plusieurs niveaux :
- Validation des types à l'entrée API
- Vérification des relations (foreign keys)
- Validation des fichiers uploadés (logos)

## Système de fichiers

### Logos
- Stockés dans `/backend/public/logos/`
- Nommage unique avec timestamp
- Nettoyage automatique lors de la suppression

### Logs
- Stockés dans `/backend/logs/`
- Séparation error.log / combined.log
- Rotation automatique
- Format JSON pour analyse

## Bonnes pratiques

### Sauvegarde
- Faire un backup manuel avant modifications importantes
- Vérifier régulièrement l'état des backups automatiques
- Conserver quelques backups hors-ligne

### Maintenance
- Nettoyer régulièrement les vieux backups
- Vérifier l'espace disque disponible
- Archiver les anciens programmes