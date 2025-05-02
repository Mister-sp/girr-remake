FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Installation de serve pour servir l'application en production
RUN npm install -g serve

EXPOSE 5173

# Démarrage du serveur en mode développement pour avoir le HMR
CMD ["npm", "run", "dev", "--", "--host"]