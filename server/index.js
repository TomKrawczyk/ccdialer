const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const database = require('./database');
const authService = require('./auth');
const WebSocketServer = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve recordings
app.use('/recordings', express.static(path.join(__dirname, '..', 'data', 'recordings')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/recordings', require('./routes/recordings'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CCDialer Pro Server is running',
        version: '2.0.0',
        features: ['WiFi Calling', 'User Auth', 'Database', 'Call Recording']
    });
});

// Serve main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Generate self-signed certificate if not exists
function ensureCertificate() {
    const certDir = path.join(__dirname, '..', 'certs');
    const keyPath = path.join(certDir, 'key.pem');
    const certPath = path.join(certDir, 'cert.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    }

    // Create certs directory
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    // Generate self-signed certificate using openssl
    const { execSync } = require('child_process');
    try {
        console.log('🔐 Generowanie certyfikatu SSL...');
        execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`, {
            stdio: 'inherit'
        });
        console.log('✅ Certyfikat SSL wygenerowany');
        return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    } catch (error) {
        console.warn('⚠️  Nie można wygenerować certyfikatu SSL. Używam tylko HTTP.');
        return null;
    }
}

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await database.initialize();

        // Try to create HTTPS server
        const credentials = ensureCertificate();
        
        if (credentials) {
            // HTTPS Server
            const httpsServer = https.createServer(credentials, app);
            new WebSocketServer(httpsServer);
            
            httpsServer.listen(HTTPS_PORT, () => {
                console.log(`\n🚀 CCDialer Pro Server uruchomiony!`);
                console.log(`\n📱 HTTPS (bezpieczne): https://localhost:${HTTPS_PORT}`);
                console.log(`   Użyj tego adresu dla połączeń szyfrowanych`);
                console.log(`\n💻 Panel logowania: https://localhost:${HTTPS_PORT}/login.html`);
                console.log(`\n⚠️  Uwaga: Certyfikat jest samopodpisany - przeglądarka pokaże ostrzeżenie.`);
                console.log(`   Kliknij "Zaawansowane" i "Przejdź do strony" aby kontynuować.\n`);
                console.log(`\n👤 Domyślne konto:`);
                console.log(`   Login: admin`);
                console.log(`   Hasło: admin123\n`);
                console.log(`\n🎙️  Funkcja nagrywania rozmów: AKTYWNA\n`);
            });
        }

        // HTTP Server (fallback)
        const httpServer = http.createServer(app);
        new WebSocketServer(httpServer);
        
        httpServer.listen(PORT, () => {
            if (!credentials) {
                console.log(`\n🚀 CCDialer Pro Server uruchomiony!`);
                console.log(`\n📱 HTTP: http://localhost:${PORT}`);
                console.log(`\n💻 Panel logowania: http://localhost:${PORT}/login.html`);
                console.log(`\n👤 Domyślne konto:`);
                console.log(`   Login: admin`);
                console.log(`   Hasło: admin123\n`);
                console.log(`\n🎙️  Funkcja nagrywania rozmów: AKTYWNA\n`);
            } else {
                console.log(`📱 HTTP (nieszyfrowane): http://localhost:${PORT}`);
                console.log(`   Użyj HTTPS dla bezpiecznych połączeń\n`);
            }
        });

    } catch (error) {
        console.error('❌ Błąd uruchamiania serwera:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 Zamykanie serwera...');
    database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Zamykanie serwera...');
    database.close();
    process.exit(0);
});

// Start the server
startServer();