@echo off
setlocal
cd /d "%~dp0"
set "RODA_NODE="
for /d %%D in ("%~dp0tools\runtime\node-*-win-x64") do set "RODA_NODE=%%D"
if defined RODA_NODE set "PATH=%RODA_NODE%;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale Node.js 22 ou superior: https://nodejs.org/
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 (
 echo Este projeto precisa de Node.js 22 ou superior.
 pause
 exit /b 1
)
if not exist "node_modules\tiktok-live-connector\package.json" (
 call npm ci --no-audit --no-fund
 if errorlevel 1 (
  echo Nao foi possivel instalar o conector. Confira sua internet.
  pause
  exit /b 1
 )
)
echo Painel: http://localhost:3000
echo Cena OBS/Live Studio: http://localhost:3000/overlay.html
echo Configure a fonte de navegador com 1080 x 1920.
node server.js
pause