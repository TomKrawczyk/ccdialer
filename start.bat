@echo off
echo ========================================
echo   CCDialer Pro - Starting Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [2/3] Checking OpenSSL for certificate generation...
where openssl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: OpenSSL not found. HTTPS will not be available.
    echo You can install OpenSSL or use HTTP only.
    echo.
)

echo [3/3] Starting CCDialer Pro Server...
echo.
node server/index.js

pause