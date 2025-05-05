#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Installation de FREMEN...${NC}"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js détecté: $(node --version)${NC}"

# Demander les identifiants administrateur
echo -e "\n${CYAN}👤 Configuration du compte administrateur${NC}"
read -p "Entrez le nom d'utilisateur administrateur (defaut: admin): " admin_username
admin_username=${admin_username:-admin}

while true; do
    read -s -p "Entrez le mot de passe administrateur (minimum 6 caractères): " admin_password
    echo
    if [ -n "$admin_password" ]; then
        if [ ${#admin_password} -lt 6 ]; then
            echo -e "${RED}❌ Le mot de passe doit faire au moins 6 caractères${NC}"
            continue
        fi
        break
    else
        echo -e "${RED}❌ Le mot de passe ne peut pas être vide${NC}"
    fi
done

# Création des dossiers nécessaires
echo -e "\n${CYAN}📁 Création des dossiers...${NC}"
folders=(
    "./backend/public/logos"
    "./backend/data/backups"
    "./backend/logs"
)

for folder in "${folders[@]}"; do
    mkdir -p "$folder"
    echo -e "${GREEN}  ✓ Créé: $folder${NC}"
done

# Installation des dépendances backend
echo -e "\n${CYAN}📦 Installation des dépendances backend...${NC}"
cd backend || exit 1
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances backend${NC}"
    exit 1
fi

# Configuration du backend
if [ ! -f .env ]; then
    cat > .env << EOL
PORT=3001
NODE_ENV=development
MAX_BACKUPS=10
BACKUP_INTERVAL_HOURS=1
ADMIN_USERNAME=$admin_username
ADMIN_PASSWORD=$admin_password
JWT_SECRET=$(uuidgen || cat /proc/sys/kernel/random/uuid)
JWT_EXPIRATION=24h
EOL
    echo -e "${GREEN}  ✓ Fichier .env créé avec les identifiants personnalisés${NC}"
fi

# Installation des dépendances frontend
echo -e "\n${CYAN}📦 Installation des dépendances frontend...${NC}"
cd ../frontend || exit 1
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances frontend${NC}"
    exit 1
fi

# Configuration du frontend
if [ ! -f .env ]; then
    cat > .env << EOL
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOL
    echo -e "${GREEN}  ✓ Fichier .env créé${NC}"
fi

# Retour au dossier racine
cd ..

# Configuration git hooks (optionnel)
if [ -d .git ]; then
    echo -e "\n${CYAN}🔧 Configuration des hooks Git...${NC}"
    cp backend/scripts/pre-commit.sample .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}  ✓ Hook pre-commit installé${NC}"
fi

echo -e "\n${GREEN}✨ Installation terminée!${NC}"
echo -e "\nPour démarrer l'application:"
echo "1. Backend  : cd backend && npm start"
echo "2. Frontend : cd frontend && npm run dev"