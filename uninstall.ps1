# Script de desinstallation pour FREMEN (Windows)
Write-Host "Desinstallation de FREMEN..." -ForegroundColor Yellow

# Arreter les processus Node.js lies au projet
Write-Host "Arret des processus..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -eq "node"} | ForEach-Object {
    try {
        $_.Kill()
        Write-Host "+ Processus Node.js arrete: $($_.Id)" -ForegroundColor Green
    } catch {
        Write-Host "! Impossible d'arreter le processus: $($_.Id)" -ForegroundColor Yellow
    }
}

# Supprimer les dossiers node_modules
Write-Host "`nSuppression des dependances..." -ForegroundColor Cyan
$folders = @(
    ".\backend\node_modules",
    ".\frontend\node_modules"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force
        Write-Host "+ Supprime: $folder" -ForegroundColor Green
    }
}

# Supprimer les fichiers .env
Write-Host "`nSuppression des fichiers de configuration..." -ForegroundColor Cyan
$envFiles = @(
    ".\backend\.env",
    ".\frontend\.env"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "+ Supprime: $file" -ForegroundColor Green
    }
}

# Nettoyer les logs et backups
Write-Host "`nNettoyage des logs et backups..." -ForegroundColor Cyan
$cleanFolders = @(
    ".\backend\logs\*",
    ".\backend\data\backups\*",
    ".\backend\public\logos\*",
    ".\docker-backups\*"
)

foreach ($folder in $cleanFolders) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force
        Write-Host "+ Nettoye: $folder" -ForegroundColor Green
    }
}

# Reinitialiser le store.json
$storeFile = ".\backend\data\store.json"
if (Test-Path $storeFile) {
    @"
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
"@ | Out-File -FilePath $storeFile -Encoding UTF8
    Write-Host "+ Store.json reinitialise" -ForegroundColor Green
}

# Supprimer le hook pre-commit s'il existe
if (Test-Path ".git\hooks\pre-commit") {
    Remove-Item -Path ".git\hooks\pre-commit" -Force
    Write-Host "+ Hook pre-commit supprime" -ForegroundColor Green
}

Write-Host "`nDesinstallation terminee!" -ForegroundColor Green
Write-Host "`nPour reinstaller l'application:"
Write-Host ".\install.ps1"