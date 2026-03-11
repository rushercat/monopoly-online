@echo off
title Monopoly Online Server
color 0A

echo.
echo  ============================================
echo    MONOPOLY ONLINE - Automatischer Start
echo  ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [FEHLER] Node.js ist nicht installiert!
    echo  Bitte installiere es von: https://nodejs.org
    echo.
    pause
    exit /b
)
echo  [OK] Node.js gefunden

:: Check ngrok
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo.
    echo  =============================================
    echo   ngrok nicht gefunden! Installiere es jetzt:
    echo  =============================================
    echo.
    echo   1. Gehe zu: https://ngrok.com/download
    echo   2. Lade die Windows-Version herunter
    echo   3. Entpacke ngrok.exe in diesen Ordner
    echo      ODER installiere mit: winget install ngrok
    echo.
    echo   4. Erstelle einen GRATIS-Account:
    echo      https://dashboard.ngrok.com/signup
    echo.
    echo   5. Kopiere deinen Auth-Token von:
    echo      https://dashboard.ngrok.com/get-started/your-authtoken
    echo.
    echo   6. Fuehre aus:
    echo      ngrok config add-authtoken DEIN_TOKEN
    echo.
    echo   7. Starte dieses Skript erneut!
    echo.
    pause
    exit /b
)
echo  [OK] ngrok gefunden

:: Start server in background
echo.
echo  [....] Starte Monopoly Server auf Port 3000...
start /b cmd /c "node server.js"
timeout /t 2 /nobreak >nul
echo  [OK] Server laeuft!

:: Start ngrok
echo.
echo  [....] Oeffne ngrok Tunnel...
echo.
echo  ============================================
echo   Gleich erscheint deine oeffentliche URL!
echo   Schicke sie an deine Freunde zum Spielen.
echo  ============================================
echo.
echo  Druecke Strg+C zum Beenden.
echo.

ngrok http 3000
