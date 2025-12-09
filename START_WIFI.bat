@echo off
echo ================================================
echo   CCDialer WiFi Edition - Uruchamianie
echo ================================================
echo.
echo 1. Instalowanie zaleznosci...
call npm install
echo.
echo 2. Uruchamianie serwera WebSocket...
echo.
echo ================================================
echo   Serwer uruchomiony!
echo ================================================
echo.
echo Desktop (komputer): http://localhost:3001/index-wifi.html
echo Phone (telefon):    http://[TWOJ_IP]:3001
echo.
echo Aby znalezc swoj adres IP, wpisz: ipconfig
echo.
echo Nacisnij Ctrl+C aby zatrzymac serwer
echo ================================================
echo.
node websocket-server.js
pause