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
if not exist "node_modules\three\build\three.module.js" (
 call npm ci --no-audit --no-fund
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
node launch-window.mjs
if errorlevel 1 pause
