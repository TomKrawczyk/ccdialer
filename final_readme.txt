# 🎙️ CCDialer Pro - Cloud Recording Edition

Profesjonalny system obdzwaniania z **automatycznym nagrywaniem rozmów** i **zapisem do chmury** (Google Drive, lokalny serwer, AWS S3).

---

## ✨ Funkcje

### 🎯 Główne możliwości:
- ✅ **Automatyczne nagrywanie** wszystkich rozmów
- ☁️ **Zapis do Google Drive** - bezpieczne przechowywanie w chmurze
- 💾 **Lokalny backup** - wszystkie nagrania zapisywane na serwerze
- 🔍 **Panel zarządzania** - przeglądanie, wyszukiwanie, odtwarzanie
- 📊 **Statystyki** - analiza czasu rozmów, ilości nagrań
- 🔒 **Bezpieczeństwo** - szyfrowane połączenia, zgodność z RODO
- 📱 **WiFi** - bez kabli USB i ADB
- 🌐 **Multi-platform** - działa na Android/iOS

### 📁 Miejsca zapisu nagrań:
1. **Lokalny serwer** - `recordings/` (automatyczny backup)
2. **Google Drive** - automatyczny upload do chmury
3. **AWS S3** - profesjonalne cloud storage (opcjonalnie)

---

## 🚀 Szybki start

### 1. Zainstaluj zależności

```bash
npm install
```

### 2. (Opcjonalnie) Skonfiguruj Google Drive

Zobacz: `GOOGLE_DRIVE_SETUP.md` - szczegółowa instrukcja krok po kroku

Krótko:
1. Utwórz projekt w Google Cloud Console
2. Włącz Google Drive API
3. Uzyskaj Client ID, Client Secret, Refresh Token
4. Dodaj do pliku `.env`:

```bash
GOOGLE_CLIENT_ID=twoj_client_id
GOOGLE_CLIENT_SECRET=twoj_client_secret
GOOGLE_REFRESH_TOKEN=twoj_refresh_token
GOOGLE_DRIVE_FOLDER_ID=twoj_folder_id
```

### 3. Uruchom serwery

**Windows:**
```bash
START_ALL.bat
```

**Linux/Mac:**
```bash
chmod +x START_ALL.sh
./START_ALL.sh
```

Lub ręcznie:
```bash
# Terminal 1: WebSocket Server
npm run wifi

# Terminal 2: Recording Server
npm run recording
```

### 4. Otwórz aplikacje

**Na komputerze:**
- Desktop: http://localhost:3001/index-wifi.html
- Panel nagrań: http://localhost:3003/recordings-dashboard.html

**Na telefonie (w tej samej sieci WiFi):**
- Phone App: http://[ADRES_IP_KOMPUTERA]:3001

---

## 📋 Instrukcja użytkowania

### Na TELEFONIE:

1. Otwórz http://[IP_KOMPUTERA]:3001
2. Kliknij **"Zezwól na nagrywanie"** (uprawnienia mikrofonu)
3. Wybierz miejsce zapisu:
   - `Lokalny serwer` - zapisuje na komputerze
   - `Google Drive` - wysyła do chmury Google
4. Kliknij **"Połącz z komputerem"**
5. Status zmieni się na **zielony** ✅

### Na KOMPUTERZE:

1. Otwórz http://localhost:3001/index-wifi.html
2. Kliknij **"Demo"** lub **"Załaduj dane"** (Google Sheets)
3. Wybierz kontakt
4. Kliknij **"Zadzwoń przez WiFi"**
5. Telefon automatycznie:
   - 📞 Zadzwoni
   - 🎙️ Rozpocznie nagrywanie
   - ☁️ Wyśle nagranie po zakończeniu rozmowy

### Panel nagrań:

1. Otwórz http://localhost:3003/recordings-dashboard.html
2. Przeglądaj wszystkie nagrania
3. Odtwarzaj, pobieraj lub usuwaj nagrania
4. Wyszukuj po numerze, nazwie lub dacie

---

## 📂 Struktura projektu

```
ccdialer/
├── phone-companion/
│   ├── index.html              # Aplikacja telefonu (z nagrywaniem)
│   └── manifest.json           # PWA manifest
├── recordings/                 # Katalog nagrań (tworzony automatycznie)
│   ├── 2024-12-09/
│   │   ├── recording_+48123456789_1234567890.webm
│   │   └── recording_+48123456789_1234567890.json
│   └── 2024-12-10/
├── websocket-server.js         # Serwer WebSocket (łączy telefon z komputerem)
├── recording-server.js         # Serwer nagrań (upload, storage, API)
├── index-wifi.html             # Aplikacja desktop
├── recordings-dashboard.html   # Panel zarządzania nagraniami
├── .env                        # Konfiguracja (Google Drive itp.)
├── package.json
├── START_ALL.bat              # Windows - uruchom wszystko
└── GOOGLE_DRIVE_SETUP.md      # Instrukcja Google Drive
```

---

## 🔧 API Endpoints

### Recording Server (port 3003)

#### Upload nagrania
```bash
POST /api/upload-recording
Content-Type: multipart/form-data

Body:
- recording: File (audio/webm)
- phoneNumber: string
- contactName: string
- duration: number (sekundy)
- timestamp: string (ISO)
```

#### Lista nagrań
```bash
GET /api/recordings

Response:
{
  "success": true,
  "total": 42,
  "recordings": [...]
}
```

#### Wyszukiwanie
```bash
GET /api/recordings/search?query=123456&startDate=2024-12-01&endDate=2024-12-31

Query params:
- query: numer lub nazwa (opcjonalnie)
- startDate: data od (opcjonalnie)
- endDate: data do (opcjonalnie)
- status: status połączenia (opcjonalnie)
```

#### Statystyki
```bash
GET /api/statistics

Response:
{
  "success": true,
  "statistics": {
    "totalRecordings": 42,
    "totalDuration": 12345,
    "totalSize": 456789012,
    "averageDuration": 294,
    ...
  }
}
```

#### Pobierz nagranie
```bash
GET /api/recordings/:date/:filename
```

#### Usuń nagranie
```bash
DELETE /api/recordings/:date/:filename
```

#### Upload do Google Drive
```bash
POST /api/upload-to-google-drive
(wymaga konfiguracji .env)
```

---

## ⚖️ Aspekty prawne

### ⚠️ BARDZO WAŻNE - Przed użyciem:

1. **Zgoda na nagrywanie**
   - W Polsce nagrywanie rozmów wymaga zgody drugiej strony (art. 267 KK)
   - Informuj każdego rozmówcę o nagrywaniu **na początku rozmowy**
   - Przykład: *"Dzień dobry, rozmowa jest nagrywana w celach jakościowych. Czy wyraża Pan/Pani zgodę?"*

2. **RODO - ochrona danych osobowych**
   - Nagrania są danymi osobowymi
   - Musisz mieć podstawę prawną do przetwarzania
   - Informuj o celu nagrywania i czasie przechowywania
   - Zapewnij prawo dostępu, usunięcia, sprostowania

3. **Przechowywanie nagrań**
   - Przechowuj tylko przez niezbędny okres
   - Zabezpiecz przed nieautoryzowanym dostępem
   - Usuń po upływie okresu przechowywania

4. **Przykładowa klauzula RODO:**
   ```
   "Informujemy, że rozmowa jest nagrywana w celu zapewnienia 
   jakości obsługi i rozpatrywania reklamacji. Nagranie będzie 
   przechowywane przez [okres] i zostanie usunięte po tym czasie. 
   Ma Pan/Pani prawo dostępu do nagrania oraz jego usunięcia."
   ```

### 📄 Wzór zgody (do nagrania przed rozmową):

```
"Dzień dobry, mam na imię [Imię] i dzwonię z firmy [Nazwa].

Ta rozmowa jest nagrywana wyłącznie w celach jakościowych 
i szkoleniowych. Nagranie będzie przechowywane przez maksymalnie 
[30 dni/90 dni] i następnie automatycznie usunięte.

Czy wyraża Pan/Pani zgodę na nagrywanie tej rozmowy?

[Jeśli TAK] - Dziękuję, rozpoczynamy.
[Jeśli NIE] - Rozumiem, w takim razie nie będę nagrywał rozmowy."
```

---

## 💾 Koszty i pojemności

### Lokalny serwer (darmowy)
- Ograniczony tylko miejscem na dysku
- 1 minuta nagrania ≈ **450 KB**
- 100 rozmów × 5 min = **~225 MB**
- Dysk 100 GB = **~44,000 rozmów**

### Google Drive
| Plan | Cena | Pojemność | Nagrań (~5min) |
|------|------|-----------|----------------|
| Free | 0 zł | 15 GB | ~6,600 |
| Basic | 8 zł/mc | 100 GB | ~44,000 |
| Standard | 32 zł/mc | 200 GB | ~88,000 |
| Premium | 40 zł/mc | 2 TB | ~880,000 |

### AWS S3 (pay-as-you-go)
- **$0.023/GB/miesiąc** - przechowywanie
- **$0.09/GB** - upload
- 1000 rozmów/mc = ~**2.25 GB** = **$0.26/mc**

**Rekomendacja:**
- Do 500 rozmów/mc: **Google Drive Free**
- 500-5000 rozmów/mc: **Google Drive Basic**
- \>5000 rozmów/mc: **AWS S3** (najtańsze przy dużej skali)

---

## 🔍 Rozwiązywanie problemów

### Problem: Telefon nie nagrywa

**Przyczyny:**
1. Brak uprawnień do mikrofonu
2. Przeglądarka nie wspiera MediaRecorder API
3. Połączenie HTTPS wymagane (localhost działa)

**Rozwiązanie:**
1. Kliknij "Zezwól na nagrywanie" w aplikacji telefonu
2. Użyj Chrome/Safari (najlepsza kompatybilność)
3. Na produkcji użyj HTTPS (Let's Encrypt)

### Problem: Nagrania nie uploadują się

**Przyczyny:**
1. Serwer nagrań nie działa
2. Zły adres Recording Server
3. Brak połączenia sieciowego

**Rozwiązanie:**
```bash
# Sprawdź czy serwer działa
curl http://localhost:3003/api/health

# Sprawdź logi serwera
# Terminal z recording-server.js powinien pokazywać aktywność
```

### Problem: Google Drive upload fails

**Przyczyny:**
1. Nieprawidłowe credentials w `.env`
2. Wygasły Refresh Token
3. Brak uprawnień do folderu

**Rozwiązanie:**
1. Sprawdź `.env` - upewnij się że wszystkie pola są wypełnione
2. Wygeneruj nowy Refresh Token (zobacz `GOOGLE_DRIVE_SETUP.md`)
3. Sprawdź permissions folderu na Google Drive

### Problem: Zła jakość nagrania

**Przyczyny:**
1. Telefon używa słuchawki zamiast głośnika
2. Wysoka kompresja audio

**Rozwiązanie:**
1. Użyj głośnika (speaker) podczas rozmowy
2. W `phone-companion/index.html` zmień:
```javascript
mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000  // Dodaj tę linię (128 kbps)
});
```

---

## 🛠️ Zaawansowane

### Automatyczne czyszczenie starych nagrań

Dodaj do `recording-server.js`:

```javascript
// Auto-delete recordings older than 90 days
setInterval(async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const days = await fs.readdir(RECORDINGS_DIR);
    for (const day of days) {
        const dayDate = new Date(day);
        if (dayDate < ninetyDaysAgo) {
            await fs.rm(path.join(RECORDINGS_DIR, day), { recursive: true });
            console.log(`🗑️ Deleted old recordings: ${day}`);
        }
    }
}, 24 * 60 * 60 * 1000); // Check daily
```

### Webhook notifications

Wyślij powiadomienie po zapisaniu nagrania:

```javascript
// W recording-server.js po zapisaniu nagrania:
await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        event: 'recording_saved',
        phoneNumber: metadata.phoneNumber,
        contactName: metadata.contactName,
        duration: metadata.duration,
        url: `http://yourserver.com/recordings/${filename}`
    })
});
```

### Transkrypcja audio → tekst

Integracja z Google Speech-to-Text API:

```bash
npm install @google-cloud/speech
```

---

## 📞 Wsparcie

Masz problemy? Sprawdź:
1. **Logi serwera** - terminal pokazuje wszystkie błędy
2. **Konsola przeglądarki** (F12) - błędy JavaScript
3. **Health check**: http://localhost:3003/api/health

---

## 📄 Licencja

MIT License - użyj swobodnie, na własną odpowiedzialność.

**⚠️ WAŻNE:** Pamiętaj o przestrzeganiu przepisów prawnych dotyczących nagrywania rozmów w Twoim kraju!

---

## 🎉 Gotowe!

Masz teraz w pełni funkcjonalny system nagrywania rozmów z automatycznym zapisem do chmury!

**Kolejne kroki:**
1. Skonfiguruj Google Drive (opcjonalnie)
2. Nagraj testową rozmowę
3. Sprawdź nagranie w panelu (`recordings-dashboard.html`)
4. Dostosuj ustawienia RODO do Twojej firmy

---

**Pytania? Problemy? Sugestie?**  
Sprawdź dokumentację lub skontaktuj się z supportem.