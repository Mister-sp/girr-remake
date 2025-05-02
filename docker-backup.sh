#!/bin/bash

# Configuration
BACKUP_DIR="docker-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
MAX_BACKUPS=5

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Créer l'archive des volumes
echo "Création du backup des volumes Docker..."
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/volumes_$DATE.tar.gz \
  /var/lib/docker/volumes/

# Nettoyer les anciens backups
echo "Nettoyage des anciens backups..."
ls -t $BACKUP_DIR/volumes_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm

echo "Backup terminé : $BACKUP_DIR/volumes_$DATE.tar.gz"