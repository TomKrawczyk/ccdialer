<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCDialer - Phone Companion (Recording)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4F46E5">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
<body class="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
        <!-- Connection Card -->
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <!-- Logo -->
            <div class="text-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2">CCDialer Phone</h1>
                <p class="text-white/70">Companion App with Recording</p>
            </div>

            <!-- Status -->
            <div id="status" class="mb-6 p-4 rounded-xl border-2 border-gray-500 bg-gray-700/50">
                <div class="flex items-center gap-3">
                    <div id="statusDot" class="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span id="statusText" class="text-white font-medium">Rozłączony</span>
                </div>
            </div>

            <!-- Recording Status -->
            <div id="recordingStatus" class="mb-6 p-4 rounded-xl border-2 border-red-500 bg-red-700/50 hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span class="text-white font-medium">Nagrywanie aktywne</span>
                    </div>
                    <span id="recordingTime" class="text-white/70 text-sm font-mono">0:00</span>
                </div>
            </div>

            <!-- Server URL Input -->
            <div class="mb-6">
                <label class="block text-white/90 text-sm font-medium mb-2">Adres serwera (IP komputera)</label>
                <input type="text" id="serverUrl" value="localhost:3002" placeholder="192.168.1.100:3002"
                       class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <p class="text-xs text-white/50 mt-1">Użyj adresu IP komputera jeśli nie działa localhost</p>
            </div>

            <!-- Recording Permission -->
            <div class="mb-6">
                <button onclick="requestRecordingPermission()" id="permissionBtn" class="w-full bg-yellow-500/20 border-2 border-yellow-500 hover:bg-yellow-500/30 text-yellow-100 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    Zezwól na nagrywanie
                </button>
            </div>

            <!-- Connect Button -->
            <button onclick="toggleConnection()" id="connectBtn" 
                    class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg mb-4">
                Połącz z komputerem
            </button>

            <!-- Current Call Info -->
            <div id="callInfo" class="mt-6 p-4 rounded-xl bg-green-500/20 border-2 border-green-500 hidden">
                <div class="text-center">
                    <p class="text-white/70 text-sm mb-1">Aktywne połączenie:</p>
                    <p id="currentNumber" class="text-white font-bold text-xl"></p>
                    <p id="currentName" class="text-white/80 text-sm"></p>
                </div>
            </div>

            <!-- Recordings List -->
            <div id="recordingsList" class="mt-6 hidden">
                <h3 class="text-white font-bold mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path>
                    </svg>
                    Nagrania (
                    <span id="recordingsCount">0</span>)
                </h3>
                <div id="recordingsContainer" class="space-y-2 max-h-40 overflow-y-auto">
                    <!-- Recordings will be added here -->
                </div>
            </div>

            <!-- Info -->
            <div class="mt-6 p-4 bg-blue-500/20 rounded-xl border border-blue-500/50">
                <p class="text-white/80 text-sm">
                    ⚠️ <strong>Uwaga prawna:</strong> Nagrywanie rozmów wymaga zgody drugiej strony. 
                    Informuj rozmówców o nagrywaniu na początku każdej rozmowy.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6">
            <p class="text-white/50 text-sm">CCDialer Pro v2.1 - Recording Edition</p>
        </div>
    </div>

    <script>
        let ws = null;
        let isConnected = false;
        let phoneId = `phone_${Date.now()}`;
        let mediaRecorder = null;
        let audioChunks = [];
        let recordingStartTime = null;
        let recordingInterval = null;
        let recordings = [];
        let currentCall = null;
        let hasRecordingPermission = false;

        // Request recording permission
        async function requestRecordingPermission() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                hasRecordingPermission = true;
                
                // Stop the stream immediately - we just wanted permission
                stream.getTracks().forEach(track => track.stop());
                
                document.getElementById('permissionBtn').innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Uprawnienia przyznane
                `;
                document.getElementById('permissionBtn').classList.remove('bg-yellow-500/20', 'border-yellow-500', 'text-yellow-100');
                document.getElementById('permissionBtn').classList.add('bg-green-500/20', 'border-green-500', 'text-green-100');
                document.getElementById('permissionBtn').disabled = true;
                
                alert('✅ Uprawnienia do nagrywania przyznane!\n\nTeraz możesz nagrywać rozmowy.');
            } catch (error) {
                console.error('Błąd uprawnień:', error);
                alert('❌ Nie udało się uzyskać uprawnień do nagrywania.\n\nSprawdź ustawienia przeglądarki i zezwól na dostęp do mikrofonu.');
            }
        }

        // Start recording
        async function startRecording() {
            if (!hasRecordingPermission) {
                console.log('Brak uprawnień do nagrywania');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } 
                });

                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    saveRecording(audioBlob);
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                recordingStartTime = Date.now();
                
                // Update recording time
                recordingInterval = setInterval(updateRecordingTime, 1000);
                
                document.getElementById('recordingStatus').classList.remove('hidden');
                
                console.log('✅ Nagrywanie rozpoczęte');
            } catch (error) {
                console.error('Błąd nagrywania:', error);
                alert('Nie udało się rozpocząć nagrywania: ' + error.message);
            }
        }

        // Stop recording
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                if (recordingInterval) {
                    clearInterval(recordingInterval);
                    recordingInterval = null;
                }
                
                document.getElementById('recordingStatus').classList.add('hidden');
                console.log('⏹️ Nagrywanie zakończone');
            }
        }

        // Update recording time display
        function updateRecordingTime() {
            if (recordingStartTime) {
                const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
                const mins = Math.floor(elapsed / 60);
                const secs = elapsed % 60;
                document.getElementById('recordingTime').textContent = 
                    `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        }

        // Save recording
        function saveRecording(blob) {
            const recording = {
                id: Date.now(),
                phoneNumber: currentCall?.phoneNumber || 'unknown',
                contactName: currentCall?.contactName || 'Nieznany',
                date: new Date().toISOString(),
                duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0,
                blob: blob,
                url: URL.createObjectURL(blob)
            };

            recordings.push(recording);
            updateRecordingsList();
            
            console.log(`💾 Nagranie zapisane: ${recording.phoneNumber} (${recording.duration}s)`);
        }

        // Update recordings list
        function updateRecordingsList() {
            document.getElementById('recordingsCount').textContent = recordings.length;
            
            if (recordings.length > 0) {
                document.getElementById('recordingsList').classList.remove('hidden');
            }

            const container = document.getElementById('recordingsContainer');
            container.innerHTML = recordings.map(rec => {
                const date = new Date(rec.date);
                const dateStr = date.toLocaleString('pl-PL');
                const mins = Math.floor(rec.duration / 60);
                const secs = rec.duration % 60;
                const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                
                return `
                    <div class="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex-1">
                                <p class="text-white font-medium text-sm">${rec.contactName}</p>
                                <p class="text-white/60 text-xs">${rec.phoneNumber}</p>
                            </div>
                            <span class="text-white/70 text-xs">${durationStr}</span>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button onclick="playRecording(${rec.id})" class="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-100 py-2 px-3 rounded text-xs flex items-center justify-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                Odtwórz
                            </button>
                            <button onclick="downloadRecording(${rec.id})" class="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 py-2 px-3 rounded text-xs flex items-center justify-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Pobierz
                            </button>
                        </div>
                        <p class="text-white/40 text-xs mt-2">${dateStr}</p>
                    </div>
                `;
            }).reverse().join('');
        }

        // Play recording
        function playRecording(id) {
            const recording = recordings.find(r => r.id === id);
            if (recording) {
                const audio = new Audio(recording.url);
                audio.play();
            }
        }

        // Download recording
        function downloadRecording(id) {
            const recording = recordings.find(r => r.id === id);
            if (recording) {
                const a = document.createElement('a');
                a.href = recording.url;
                a.download = `nagranie_${recording.phoneNumber}_${new Date(recording.date).toISOString().slice(0,10)}.webm`;
                a.click();
            }
        }

        // Toggle connection
        function toggleConnection() {
            if (isConnected) {
                disconnect();
            } else {
                connect();
            }
        }

        // Connect to server
        function connect() {
            const serverUrl = document.getElementById('serverUrl').value;
            const wsUrl = `ws://${serverUrl}`;

            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log('✅ Połączono z serwerem');
                    isConnected = true;
                    updateConnectionStatus(true);

                    // Register as phone
                    ws.send(JSON.stringify({
                        type: 'register_phone',
                        phoneId: phoneId
                    }));

                    // Keep connection alive
                    setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'ping' }));
                        }
                    }, 30000);
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log('📨 Otrzymano:', data);

                    switch (data.type) {
                        case 'registered':
                            console.log('✅ Zarejestrowano jako telefon:', data.phoneId);
                            break;

                        case 'call_command':
                            makeCall(data.phoneNumber, data.contactName);
                            break;
                    }
                };

                ws.onerror = (error) => {
                    console.error('❌ Błąd WebSocket:', error);
                    alert('Nie można połączyć z serwerem. Sprawdź adres IP.');
                };

                ws.onclose = () => {
                    console.log('🔌 Rozłączono');
                    isConnected = false;
                    updateConnectionStatus(false);
                    stopRecording(); // Stop recording if disconnected
                };

            } catch (error) {
                console.error('Błąd połączenia:', error);
                alert('Błąd połączenia: ' + error.message);
            }
        }

        // Disconnect
        function disconnect() {
            if (ws) {
                ws.close();
                stopRecording();
            }
        }

        // Update connection status UI
        function updateConnectionStatus(connected) {
            const statusDot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            const status = document.getElementById('status');
            const connectBtn = document.getElementById('connectBtn');

            if (connected) {
                statusDot.className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse';
                statusText.textContent = 'Połączony';
                status.className = 'mb-6 p-4 rounded-xl border-2 border-green-500 bg-green-700/50';
                connectBtn.textContent = 'Rozłącz';
                connectBtn.className = 'w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg mb-4';
            } else {
                statusDot.className = 'w-3 h-3 rounded-full bg-gray-400';
                statusText.textContent = 'Rozłączony';
                status.className = 'mb-6 p-4 rounded-xl border-2 border-gray-500 bg-gray-700/50';
                connectBtn.textContent = 'Połącz z komputerem';
                connectBtn.className = 'w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg mb-4';
            }
        }

        // Make call
        function makeCall(phoneNumber, contactName) {
            currentCall = { phoneNumber, contactName };
            
            console.log(`📞 Dzwonię: ${contactName} (${phoneNumber})`);
            
            // Show call info
            document.getElementById('currentNumber').textContent = phoneNumber;
            document.getElementById('currentName').textContent = contactName;
            document.getElementById('callInfo').classList.remove('hidden');

            // Start recording if permission granted
            if (hasRecordingPermission) {
                startRecording();
            }

            // Try to make actual phone call
            try {
                window.location.href = `tel:${phoneNumber}`;

                // Send confirmation
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'call_started',
                        phoneId: phoneId,
                        phoneNumber: phoneNumber
                    }));
                }

                // Auto-stop recording after typical call duration (5 minutes)
                setTimeout(() => {
                    stopRecording();
                    document.getElementById('callInfo').classList.add('hidden');
                    currentCall = null;
                }, 5 * 60 * 1000);

            } catch (error) {
                console.error('Błąd wykonywania połączenia:', error);
                
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'call_failed',
                        phoneId: phoneId,
                        error: error.message
                    }));
                }
                
                stopRecording();
                document.getElementById('callInfo').classList.add('hidden');
            }
        }

        // Prevent screen sleep
        let wakeLock = null;

        async function requestWakeLock() {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('🔆 Wake Lock aktywny - ekran nie będzie się wyłączać');
                }
            } catch (err) {
                console.log('Wake Lock niedostępny:', err);
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            requestWakeLock();
        });

        // Re-acquire wake lock when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        });
    </script>
</body>
</html>