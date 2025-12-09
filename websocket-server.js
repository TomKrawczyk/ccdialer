const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'phone-companion')));

const HTTP_PORT = 3001;
const WS_PORT = 3002;

// HTTP Server for serving phone companion app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'phone-companion', 'index.html'));
});

app.listen(HTTP_PORT, () => {
    console.log(`📱 Phone Companion App: http://localhost:${HTTP_PORT}`);
    console.log(`   Otwórz ten adres na telefonie w tej samej sieci WiFi`);
});

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

const clients = {
    desktop: null,
    phones: []
};

wss.on('connection', (ws, req) => {
    console.log('🔌 Nowe połączenie WebSocket');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 Otrzymano wiadomość:', data);

            switch (data.type) {
                case 'register_desktop':
                    clients.desktop = ws;
                    ws.clientType = 'desktop';
                    console.log('💻 Desktop zarejestrowany');
                    ws.send(JSON.stringify({
                        type: 'registered',
                        clientType: 'desktop',
                        connectedPhones: clients.phones.length
                    }));
                    break;

                case 'register_phone':
                    clients.phones.push(ws);
                    ws.clientType = 'phone';
                    ws.phoneId = data.phoneId || `phone_${Date.now()}`;
                    console.log(`📱 Telefon zarejestrowany: ${ws.phoneId}`);
                    ws.send(JSON.stringify({
                        type: 'registered',
                        clientType: 'phone',
                        phoneId: ws.phoneId
                    }));
                    
                    // Notify desktop about new phone
                    if (clients.desktop) {
                        clients.desktop.send(JSON.stringify({
                            type: 'phone_connected',
                            phoneId: ws.phoneId,
                            totalPhones: clients.phones.length
                        }));
                    }
                    break;

                case 'make_call':
                    console.log(`📞 Żądanie połączenia: ${data.phoneNumber}`);
                    // Send to all connected phones
                    clients.phones.forEach(phone => {
                        if (phone.readyState === WebSocket.OPEN) {
                            phone.send(JSON.stringify({
                                type: 'call_command',
                                phoneNumber: data.phoneNumber,
                                contactName: data.contactName || 'Nieznany'
                            }));
                        }
                    });
                    break;

                case 'call_started':
                    console.log(`✅ Połączenie rozpoczęte na ${data.phoneId}`);
                    if (clients.desktop) {
                        clients.desktop.send(JSON.stringify({
                            type: 'call_status',
                            status: 'started',
                            phoneId: data.phoneId,
                            phoneNumber: data.phoneNumber
                        }));
                    }
                    break;

                case 'call_failed':
                    console.log(`❌ Błąd połączenia na ${data.phoneId}: ${data.error}`);
                    if (clients.desktop) {
                        clients.desktop.send(JSON.stringify({
                            type: 'call_status',
                            status: 'failed',
                            phoneId: data.phoneId,
                            error: data.error
                        }));
                    }
                    break;
            }
        } catch (error) {
            console.error('Błąd parsowania wiadomości:', error);
        }
    });

    ws.on('close', () => {
        if (ws.clientType === 'desktop') {
            console.log('💻 Desktop rozłączony');
            clients.desktop = null;
        } else if (ws.clientType === 'phone') {
            console.log(`📱 Telefon rozłączony: ${ws.phoneId}`);
            clients.phones = clients.phones.filter(phone => phone !== ws);
            
            // Notify desktop about phone disconnection
            if (clients.desktop) {
                clients.desktop.send(JSON.stringify({
                    type: 'phone_disconnected',
                    phoneId: ws.phoneId,
                    totalPhones: clients.phones.length
                }));
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log(`🚀 WebSocket Server uruchomiony na ws://localhost:${WS_PORT}`);
console.log(`\n📋 Instrukcja:`);
console.log(`1. Otwórz http://localhost:3000 na komputerze (desktop)`);
console.log(`2. Otwórz http://localhost:${HTTP_PORT} na telefonie (w tej samej sieci WiFi)`);
console.log(`3. Kliknij "Połącz" na telefonie`);
console.log(`4. Telefon będzie automatycznie dzwonił po kliknięciu "Zadzwoń" na komputerze\n`);