# Music Downloader Deployment Script for Windows PowerShell
# Usage: .\deploy.ps1 [Build|Deploy|Clean]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Build", "Deploy", "Clean")]
    [string]$Action
)

$ProjectName = "music-downloader"
$ImageName = "music-downloader-app"
$ContainerName = "music-downloader-container"

Write-Host "🎵 Music Downloader Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

switch ($Action) {
    "Build" {
        Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
        docker build -t $ImageName .
        Write-Host "✅ Build completed!" -ForegroundColor Green
    }
    
    "Deploy" {
        Write-Host "🚀 Deploying application..." -ForegroundColor Yellow
        
        # Stop and remove existing container
        Write-Host "Stopping existing container..." -ForegroundColor Cyan
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
        
        # Run new container
        Write-Host "Starting new container..." -ForegroundColor Cyan
        docker run -d `
            --name $ContainerName `
            --restart unless-stopped `
            -p 80:80 `
            $ImageName
        
        Write-Host "✅ Deployment completed!" -ForegroundColor Green
        Write-Host "Application is running on http://localhost" -ForegroundColor Blue
    }
    
    "Clean" {
        Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
        docker rmi $ImageName 2>$null
        Write-Host "✅ Cleanup completed!" -ForegroundColor Green
    }
}