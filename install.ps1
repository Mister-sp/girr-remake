# Script d'installation automatisee pour FREMEN (Windows)
Write-Host "Installation de FREMEN..." -ForegroundColor Cyan

# Verifier si Node.js est installe
try {
    $nodeVersion = node --version
    Write-Host "+ Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "x Node.js n'est pas installe. Veuillez l'installer depuis https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Creation des dossiers necessaires
Write-Host "`nCreation des dossiers..." -ForegroundColor Cyan
$folders = @(
    ".\backend\public\logos",
    ".\backend\data\backups",
    ".\backend\logs"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "+ Cree: $folder" -ForegroundColor Green
    }
}

# Installation des dependances backend
Write-Host "`nInstallation des dependances backend..." -ForegroundColor Cyan
Set-Location .\backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "x Erreur lors de l'installation des dependances backend" -ForegroundColor Red
    exit 1
}

# Configuration du backend
if (!(Test-Path .env)) {
    @"
PORT=3001
NODE_ENV=development
MAX_BACKUPS=10
BACKUP_INTERVAL_HOURS=1
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "+ Fichier .env cree" -ForegroundColor Green
}

# Installation des dependances frontend
Write-Host "`nInstallation des dependances frontend..." -ForegroundColor Cyan
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "x Erreur lors de l'installation des dependances frontend" -ForegroundColor Red
    exit 1
}

# Configuration du frontend
if (!(Test-Path .env)) {
    @"
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "+ Fichier .env cree" -ForegroundColor Green
}

# Retour au dossier racine
Set-Location ..

# Configuration git hooks (optionnel)
if (Test-Path .git) {
    Write-Host "`nConfiguration des hooks Git..." -ForegroundColor Cyan
    Copy-Item .\backend\scripts\pre-commit.sample .git\hooks\pre-commit -Force
    Write-Host "+ Hook pre-commit installe" -ForegroundColor Green
}

Write-Host "`nInstallation terminee!" -ForegroundColor Green
Write-Host "`nPour demarrer l'application:"
Write-Host "1. Backend  : cd backend && npm start"
Write-Host "2. Frontend : cd frontend && npm run dev"