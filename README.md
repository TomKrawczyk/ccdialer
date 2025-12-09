# CCDialer - WiFi Edition

Prosty system obdzwaniania przez WiFi bez potrzeby ADB i USB Debugging.

## 🚀 Jak to działa?

1. **Komputer (Desktop)** - steruje wszystkim, wyświetla kontakty, formularz
2. **Telefon (Companion App)** - automatycznie dzwoni po otrzymaniu komendy przez WiFi
3. **Serwer WebSocket** - łączy komputer z telefonem w sieci lokalnej

## 📋 Wymagania

- Node.js 14+ zainstalowany na komputerze
- Komputer i telefon w tej samej sieci WiFi
- Przeglądarka na telefonie (Chrome, Safari, Firefox)

## 🔧 Instalacja

### 1. Zainstaluj zależności

```bash
cd ccdialer
npm install
```

### 2. Uruchom serwer WebSocket

```bash
node websocket-server.js
```

Zobaczysz:
```
🚀 WebSocket Server uruchomiony na ws://localhost:3002
📱 Phone Companion App: http://localhost:3001
   Otwórz ten adres na telefonie w tej samej sieci WiFi
```

### 3. Otwórz stronę desktop na komputerze

Otwórz w przeglądarce:
```
http://localhost:3001/index-wifi.html
```

### 4. Połącz telefon

Na telefonie otwórz:
```
http://[ADRES_IP_KOMPUTERA]:3001
```

Gdzie `[ADRES_IP_KOMPUTERA]` to adres IP Twojego komputera w sieci lokalnej.

**Jak znaleźć adres IP?**

**Windows:**
```bash
ipconfig
```
Szukaj "IPv4 Address" (np. 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Szukaj "inet" (np. 192.168.1.100)

### 5. Kliknij "Połącz z komputerem" na telefonie

Po połączeniu zobaczysz zielony status "Połączony" na obu urządzeniach.

## 📱 Użytkowanie

### Na komputerze:

1. Kliknij "Demo" lub "Załaduj dane" aby wczytać kontakty
2. Kliknij "Zadzwoń przez WiFi" 
3. Telefon automatycznie zadzwoni
4. Wypełnij formularz na komputerze
5. Kliknij "Zapisz i zakończ"

### Na telefonie:

- Aplikacja działa w tle
- Automatycznie dzwoni po otrzymaniu komendy
- Możesz zminimalizować przeglądarkę
- Możesz zainstalować jako PWA (Progressive Web App) - kliknij "Zainstaluj jako aplikację"

## 🎯 Zalety vs ADB/USB

| Funkcja | ADB/USB | WiFi |
|---------|---------|------|
| Instalacja ADB | ✅ Wymagana | ❌ Nie potrzebna |
| USB Debugging | ✅ Wymagany | ❌ Nie potrzebny |
| Kabel USB | ✅ Wymagany | ❌ Nie potrzebny |
| Autoryzacja USB | ✅ Wymagana | ❌ Nie potrzebna |
| Mobilność | ❌ Ograniczona | ✅ Pełna |
| Konfiguracja | 🔴 Trudna | 🟢 Prosta |

## 🔧 Rozwiązywanie problemów

### Telefon nie łączy się

1. Sprawdź czy oba urządzenia są w tej samej sieci WiFi
2. Sprawdź czy serwer działa (`node websocket-server.js`)
3. Sprawdź czy firewall nie blokuje portów 3001 i 3002
4. Spróbuj wyłączyć firewall tymczasowo

### Telefon nie dzwoni

1. Sprawdź czy telefon ma uprawnienia do dzwonienia
2. Sprawdź czy numer jest w poprawnym formacie (+48...)
3. Sprawdź połączenie WebSocket (powinno być zielone)

### Serwer nie startuje

1. Sprawdź czy port 3001 i 3002 są wolne
2. Sprawdź czy Node.js jest zainstalowany (`node --version`)
3. Sprawdź czy zainstalowałeś zależności (`npm install`)

## 📂 Struktura plików

```
ccdialer/
├── websocket-server.js          # Serwer WebSocket
├── index-wifi.html               # Strona desktop (komputer)
├── phone-companion/
│   ├── index.html                # Aplikacja companion (telefon)
│   └── manifest.json             # PWA manifest
├── package.json                  # Zależności Node.js
└── README_WIFI.md               # Ten plik
```

## 🌐 Dostęp przez internet (opcjonalnie)

Jeśli chcesz używać z różnych sieci WiFi:

1. Użyj ngrok lub podobnego tunelu:
```bash
ngrok http 3001
```

2. Otwórz wygenerowany URL na telefonie

## 💡 Wskazówki

- **PWA Installation**: Zainstaluj aplikację companion na telefonie jako PWA dla lepszego doświadczenia
- **Keep Screen On**: Aplikacja automatycznie utrzymuje ekran włączony
- **Auto-reconnect**: Aplikacja automatycznie łączy się ponownie po utracie połączenia
- **Battery**: Aplikacja zużywa minimalną ilość baterii w trybie czuwania

## 🔐 Bezpieczeństwo

- Połączenie działa tylko w sieci lokalnej
- Brak przesyłania danych przez internet
- Brak zbierania danych osobowych
- Kod open-source - możesz sprawdzić co robi

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi serwera w terminalu
3. Upewnij się że wszystkie kroki instalacji zostały wykonane

## 🎉 Gotowe!

Teraz możesz obdzwaniać kontakty bez konieczności używania ADB i kabli USB!