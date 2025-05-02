#!/bin/bash

# Couleurs pour les messages
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Désinstallation de FREMEN...${NC}"

# Arrêter les processus Node.js liés au projet
echo -e "\n${CYAN}⏹️ Arrêt des processus...${NC}"
pkill -f "node" || true

# Supprimer les dossiers node_modules
echo -e "\n${CYAN}📦 Suppression des dépendances...${NC}"
folders=(
    "./backend/node_modules"
    "./frontend/node_modules"
)

for folder in "${folders[@]}"; do
    if [ -d "$folder" ]; then
        rm -rf "$folder"
        echo -e "${GREEN}  ✓ Supprimé: $folder${NC}"
    fi
done

# Supprimer les fichiers .env
echo -e "\n${CYAN}🔑 Suppression des fichiers de configuration...${NC}"
env_files=(
    "./backend/.env"
    "./frontend/.env"
)

for file in "${env_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}  ✓ Supprimé: $file${NC}"
    fi
done

# Nettoyer les logs et backups
echo -e "\n${CYAN}🗑️ Nettoyage des logs et backups...${NC}"
clean_folders=(
    "./backend/logs/"
    "./backend/data/backups/"
    "./backend/public/logos/"
    "./docker-backups/"
)

for folder in "${clean_folders[@]}"; do
    if [ -d "$folder" ]; then
        rm -rf "${folder}"*
        echo -e "${GREEN}  ✓ Nettoyé: $folder${NC}"
    fi
done

# Réinitialiser le store.json
store_file="./backend/data/store.json"
if [ -f "$store_file" ]; then
    cat > "$store_file" << EOL
{
  "programs": [],
  "episodes": [],
  "topics": [],
  "mediaItems": [],
  "nextProgramId": 1,
  "nextEpisodeId": 1,
  "nextTopicId": 1,
  "nextMediaId": 1
}
EOL
    echo -e "${GREEN}  ✓ Store.json réinitialisé${NC}"
fi

# Supprimer le hook pre-commit s'il existe
if [ -f ".git/hooks/pre-commit" ]; then
    rm ".git/hooks/pre-commit"
    echo -e "${GREEN}  ✓ Hook pre-commit supprimé${NC}"
fi

echo -e "\n${GREEN}✨ Désinstallation terminée!${NC}"
echo -e "\nPour réinstaller l'application:"
echo "./install.sh"