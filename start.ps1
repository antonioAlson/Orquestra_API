# Script PowerShell para iniciar Backend e Frontend em janelas separadas

Write-Host "Iniciando Maestro..." -ForegroundColor Cyan
Write-Host ""

# Verifica se as pastas existem
if (-not (Test-Path "backend")) {
    Write-Host "Pasta 'backend' nao encontrada." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "maestro")) {
    Write-Host "Pasta 'maestro' nao encontrada." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando Backend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location backend; npm run dev' | Out-Null

Start-Sleep -Seconds 2

Write-Host "Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location maestro; npm start' | Out-Null

Write-Host ""
Write-Host "Aplicacao iniciada." -ForegroundColor Green
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:4200" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este terminal foi liberado." -ForegroundColor Gray
Write-Host "Para parar os servidores, feche as janelas que foram abertas." -ForegroundColor Gray
