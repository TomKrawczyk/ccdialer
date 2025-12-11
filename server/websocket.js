const WebSocket = require('ws');
const url = require('url');
const authService = require('./auth');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // userId -> { desktop: ws, phones: [ws] }
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', async (ws, req) => {
            const params = url.parse(req.url, true).query;
            const token = params.token;

            try {
                // Verify token
                let user;
                if (token) {
                    try {
                        user = authService.verifyToken(token);
                    } catch (err) {
                        // Try as session token
                        user = await authService.verifySession(token);
                    }
                } else {
                    throw new Error('Brak tokenu');
                }

                ws.userId = user.userId;
                ws.deviceType = params.device || 'desktop';
                ws.isAlive = true;

                console.log(`✅ WebSocket połączony: User ${ws.userId}, Device: ${ws.deviceType}`);

                // Add client to map
                if (!this.clients.has(ws.userId)) {
                    this.clients.set(ws.userId, { desktop: null, phones: [] });
                }

                const userClients = this.clients.get(ws.userId);
                if (ws.deviceType === 'phone') {
                    userClients.phones.push(ws);
                } else {
                    userClients.desktop = ws;
                }

                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connected',
                    deviceType: ws.deviceType,
                    userId: ws.userId
                }));

                // Notify desktop about phone connection
                if (ws.deviceType === 'phone' && userClients.desktop) {
                    userClients.desktop.send(JSON.stringify({
                        type: 'phone_connected',
                        phoneCount: userClients.phones.length
                    }));
                }

                // Handle messages
                ws.on('message', (message) => {
                    this.handleMessage(ws, message);
                });

                // Handle pong
                ws.on('pong', () => {
                    ws.isAlive = true;
                });

                // Handle close
                ws.on('close', () => {
                    this.handleDisconnect(ws);
                });

                // Handle error
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                });

            } catch (error) {
                console.error('❌ WebSocket auth error:', error.message);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Błąd autoryzacji'
                }));
                ws.close();
            }
        });

        // Heartbeat
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        console.log('✅ WebSocket Server uruchomiony');
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            console.log(`📨 WebSocket message from User ${ws.userId}:`, data.type);

            const userClients = this.clients.get(ws.userId);
            if (!userClients) return;

            switch (data.type) {
                case 'make_call':
                    // Desktop sends call command to phones
                    if (ws.deviceType === 'desktop') {
                        userClients.phones.forEach(phone => {
                            if (phone.readyState === WebSocket.OPEN) {
                                phone.send(JSON.stringify({
                                    type: 'call_command',
                                    phoneNumber: data.phoneNumber,
                                    contactName: data.contactName,
                                    contactId: data.contactId
                                }));
                            }
                        });
                    }
                    break;

                case 'call_started':
                    // Phone notifies desktop that call started
                    if (ws.deviceType === 'phone' && userClients.desktop) {
                        userClients.desktop.send(JSON.stringify({
                            type: 'call_status',
                            status: 'started',
                            phoneNumber: data.phoneNumber,
                            contactId: data.contactId
                        }));
                    }
                    break;

                case 'call_failed':
                    // Phone notifies desktop that call failed
                    if (ws.deviceType === 'phone' && userClients.desktop) {
                        userClients.desktop.send(JSON.stringify({
                            type: 'call_status',
                            status: 'failed',
                            error: data.error,
                            contactId: data.contactId
                        }));
                    }
                    break;

                case 'call_ended':
                    // Phone notifies desktop that call ended
                    if (ws.deviceType === 'phone' && userClients.desktop) {
                        userClients.desktop.send(JSON.stringify({
                            type: 'call_status',
                            status: 'ended',
                            duration: data.duration,
                            contactId: data.contactId
                        }));
                    }
                    break;

                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    handleDisconnect(ws) {
        console.log(`🔌 WebSocket rozłączony: User ${ws.userId}, Device: ${ws.deviceType}`);

        const userClients = this.clients.get(ws.userId);
        if (!userClients) return;

        if (ws.deviceType === 'phone') {
            userClients.phones = userClients.phones.filter(phone => phone !== ws);
            
            // Notify desktop
            if (userClients.desktop && userClients.desktop.readyState === WebSocket.OPEN) {
                userClients.desktop.send(JSON.stringify({
                    type: 'phone_disconnected',
                    phoneCount: userClients.phones.length
                }));
            }
        } else {
            userClients.desktop = null;
        }

        // Clean up if no connections
        if (!userClients.desktop && userClients.phones.length === 0) {
            this.clients.delete(ws.userId);
        }
    }
}

module.exports = WebSocketServer;