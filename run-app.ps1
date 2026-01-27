# run-app.ps1
param(
    [string]$Action = "start",
    [switch]$Infra = $false
)

function Start-App {
    Write-Host "=== APPLICATION START ===" -ForegroundColor Green
    Write-Host ""
    
    if ($Infra) {
        Write-Host "STARTING INFRASTRUCTURE ONLY (DB + MinIO)" -ForegroundColor Cyan
        Write-Host ""
    }

    # Starting Docker services
    $services = @("db", "minio")
    foreach ($service in $services) {
        if (Test-Path $service) {
            Write-Host "Starting $service..." -ForegroundColor Yellow
            Set-Location $service
            docker-compose up -d
            Set-Location ".."
            Start-Sleep -Seconds 2
        }
    }

    # Starting backend (only if not infrastructure mode)
    if ((-not $Infra) -and (Test-Path "backend")) {
        Write-Host "Starting backend..." -ForegroundColor Yellow
        $backendDir = Join-Path $PWD "backend"
        $backendScript = @"
cd '$backendDir'
if (-not (Test-Path 'venv')) {
    python -m venv venv
}
& 'venv\Scripts\Activate.ps1'
pip install -r requirements.txt
python server.py
"@
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Backend'; $backendScript"
    }

    # Starting frontend (only if not infrastructure mode)
    if ((-not $Infra) -and (Test-Path "frontend")) {
        Write-Host "Starting frontend..." -ForegroundColor Yellow
        $frontendDir = Join-Path $PWD "frontend"
        $frontendScript = @"
cd '$frontendDir'
npm install
npm run dev
"@
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Frontend'; $frontendScript"
    }

    Write-Host ""
    
    if ($Infra) {
        Write-Host "=== INFRASTRUCTURE STARTED ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Only infrastructure services are running:" -ForegroundColor White
        Write-Host " - DB:      http://localhost:5001" -ForegroundColor Green
        Write-Host " - MinIO:   http://localhost:9000" -ForegroundColor Green
        Write-Host ""
        Write-Host "Backend and Frontend are NOT started" -ForegroundColor Yellow
    } else {
        Write-Host "=== ALL SERVICES STARTED ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available services:" -ForegroundColor White
        Write-Host "  - DB:      http://localhost:5432" -ForegroundColor Cyan
        Write-Host "  - MinIO:   http://localhost:9000" -ForegroundColor Cyan
        Write-Host "  - Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor Cyan
    }
}

function Stop-App {
    Write-Host "=== APPLICATION STOP ===" -ForegroundColor Red
    
    # Stopping Docker
    Write-Host "Stopping Docker services..." -ForegroundColor Yellow
    if (Test-Path "minio") { Set-Location "minio"; docker-compose down; Set-Location ".." }
    if (Test-Path "db") { Set-Location "db"; docker-compose down; Set-Location ".." }
    
    # Stopping processes (only if not infrastructure mode)
    if (-not $Infra) {
        Write-Host "Stopping backend/frontend processes..." -ForegroundColor Yellow
        Get-Process -Name "python", "node", "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
    
    if ($Infra) {
        Write-Host "=== INFRASTRUCTURE STOPPED ===" -ForegroundColor Green
    } else {
        Write-Host "=== ALL SERVICES STOPPED ===" -ForegroundColor Green
    }
}

function Show-Status {
    Write-Host "=== APPLICATION STATUS ===" -ForegroundColor Blue
    
    if ($Infra) {
        Write-Host "Mode: INFRASTRUCTURE ONLY" -ForegroundColor Cyan
    } else {
        Write-Host "Mode: ALL SERVICES" -ForegroundColor Cyan
    }
    
    # Docker containers
    Write-Host "`nDocker containers:" -ForegroundColor Yellow
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Processes (only if not infrastructure mode)
    if (-not $Infra) {
        Write-Host "`nRunning processes:" -ForegroundColor Yellow
        Get-Process -Name "python", "node", "npm" -ErrorAction SilentlyContinue | Format-Table -Property Name, Id, MainWindowTitle -AutoSize
    }
    
    Write-Host ""
}

# Main code
switch ($Action.ToLower()) {
    "start" { Start-App }
    "stop" { Stop-App }
    "status" { Show-Status }
    "restart" { Stop-App; Start-Sleep -Seconds 3; Start-App }
    default {
        Write-Host "Usage: .\run-app.ps1 [start|stop|status|restart] [-Infra]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor White
        Write-Host "  .\run-app.ps1 start               - start all services" -ForegroundColor Cyan
        Write-Host "  .\run-app.ps1 start -Infra        - start only infrastructure (DB + MinIO)" -ForegroundColor Green
        Write-Host "  .\run-app.ps1 stop                - stop all services" -ForegroundColor Cyan
        Write-Host "  .\run-app.ps1 stop -Infra         - stop only infrastructure" -ForegroundColor Green
        Write-Host "  .\run-app.ps1 status              - show status of all services" -ForegroundColor Cyan
        Write-Host "  .\run-app.ps1 status -Infra       - show infrastructure status" -ForegroundColor Green
        Write-Host "  .\run-app.ps1 restart             - restart all services" -ForegroundColor Cyan
        Write-Host "  .\run-app.ps1 restart -Infra      - restart only infrastructure" -ForegroundColor Green
        Write-Host ""
        Write-Host "Infrastructure includes: DB (db/) and MinIO (minio/)" -ForegroundColor White
        Write-Host "Applications: Backend (backend/) and Frontend (frontend/)" -ForegroundColor White
    }
}