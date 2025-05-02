# Configuration
$BackupDir = "docker-backups"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$MaxBackups = 5

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Création du backup des volumes Docker..."

# Sauvegarder les volumes Docker
docker volume ls -q | ForEach-Object {
    Write-Host "Backup du volume $_..."
    docker run --rm `
        -v "${_}:/volume" `
        -v "${PWD}/${BackupDir}:/backup" `
        alpine sh -c "cd /volume && tar czf /backup/volume_${_}_${Date}.tar.gz ."
}

# Nettoyer les anciens backups
Write-Host "Nettoyage des anciens backups..."
Get-ChildItem -Path $BackupDir -Filter "volume_*.tar.gz" | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip $MaxBackups | 
    Remove-Item -Force

Write-Host "Backup terminé dans : ${BackupDir}"