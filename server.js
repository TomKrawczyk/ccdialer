const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const USBPhoneManager = require('./usb-phone-manager');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serwuj pliki statyczne z bieżącego katalogu

// Inicjalizacja managera telefonu
const phoneManager = new USBPhoneManager();

// Endpoint: Sprawdzenie statusu telefonu
app.get('/api/phone-status', async (req, res) => {
    try {
        const status = await phoneManager.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: 'Błąd sprawdzania statusu',
            message: error.message
        });
    }
});

// Endpoint: Wykonanie połączenia
app.post('/api/call', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Brak numeru telefonu'
            });
        }

        console.log(`📞 Żądanie połączenia z numerem: ${phoneNumber}`);
        const result = await phoneManager.makeCall(phoneNumber);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        console.error('Błąd API /call:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd serwera',
            error: error.message
        });
    }
});

// Endpoint: Zakończenie połączenia
app.post('/api/end-call', async (req, res) => {
    try {
        const result = await phoneManager.endCall();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd kończenia połączenia',
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CCDialer USB Server is running' });
});

// Start serwera
app.listen(PORT, () => {
    console.log(`🚀 CCDialer USB Server uruchomiony na http://localhost:${PORT}`);
    console.log(`📱 Upewnij się, że:`);
    console.log(`   1. ADB jest zainstalowane`);
    console.log(`   2. Telefon Android ma włączony USB Debugging`);
    console.log(`   3. Telefon jest podłączony przez USB`);
    console.log(`\n💡 Otwórz http://localhost:${PORT} w przeglądarce`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Zamykanie serwera...');
    process.exit(0);
});
