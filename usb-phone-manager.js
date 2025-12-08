const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class USBPhoneManager {
    constructor() {
        this.currentCallNumber = null;
        this.isCallActive = false;
    }

    /**
     * Sprawdza czy ADB jest zainstalowane
     */
    async checkADBInstalled() {
        try {
            await execPromise('adb version');
            return true;
        } catch (error) {
            console.error('ADB nie jest zainstalowane:', error.message);
            return false;
        }
    }

    /**
     * Sprawdza czy telefon jest podłączony przez USB
     */
    async checkPhoneConnected() {
        try {
            const { stdout } = await execPromise('adb devices');
            const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
            
            if (lines.length === 0) {
                return { connected: false, message: 'Brak podłączonego telefonu' };
            }
            
            const device = lines[0].split('\t');
            if (device[1] === 'device') {
                return { connected: true, deviceId: device[0], message: 'Telefon podłączony' };
            } else if (device[1] === 'unauthorized') {
                return { connected: false, message: 'Telefon wymaga autoryzacji USB Debugging' };
            } else {
                return { connected: false, message: `Status telefonu: ${device[1]}` };
            }
        } catch (error) {
            console.error('Błąd sprawdzania telefonu:', error.message);
            return { connected: false, message: 'Błąd komunikacji z ADB' };
        }
    }

    /**
     * Formatuje numer telefonu (usuwa spacje, dodaje prefix)
     */
    formatPhoneNumber(phoneNumber) {
        // Usuń wszystkie spacje, myślniki i inne znaki
        let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Jeśli numer zaczyna się od +48, zostaw tak
        // Jeśli zaczyna się od 48, dodaj +
        // Jeśli zaczyna się od 0, zamień na +48
        if (cleaned.startsWith('+')) {
            return cleaned;
        } else if (cleaned.startsWith('48') && cleaned.length > 9) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('0')) {
            return '+48' + cleaned.substring(1);
        } else if (cleaned.length === 9) {
            return '+48' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Wykonuje połączenie telefoniczne przez ADB
     */
    async makeCall(phoneNumber) {
        try {
            // Sprawdź czy ADB jest zainstalowane
            const adbInstalled = await this.checkADBInstalled();
            if (!adbInstalled) {
                throw new Error('ADB nie jest zainstalowane. Zainstaluj Android Debug Bridge.');
            }

            // Sprawdź czy telefon jest podłączony
            const phoneStatus = await this.checkPhoneConnected();
            if (!phoneStatus.connected) {
                throw new Error(phoneStatus.message);
            }

            // Formatuj numer
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            console.log(`📞 Dzwonię na numer: ${formattedNumber}`);

            // Wykonaj połączenie przez ADB
            // Używamy android.intent.action.CALL (wymaga uprawnień CALL_PHONE)
            const command = `adb shell am start -a android.intent.action.CALL -d tel:${formattedNumber}`;
            
            const { stdout, stderr } = await execPromise(command);
            
            if (stderr && stderr.includes('Error')) {
                throw new Error(`Błąd ADB: ${stderr}`);
            }

            this.currentCallNumber = formattedNumber;
            this.isCallActive = true;

            return {
                success: true,
                message: `Połączenie zainicjowane na numer ${formattedNumber}`,
                phoneNumber: formattedNumber,
                output: stdout
            };

        } catch (error) {
            console.error('Błąd wykonywania połączenia:', error.message);
            return {
                success: false,
                message: error.message,
                phoneNumber: phoneNumber
            };
        }
    }

    /**
     * Kończy aktywne połączenie
     */
    async endCall() {
        try {
            if (!this.isCallActive) {
                return { success: true, message: 'Brak aktywnego połączenia' };
            }

            // Symulacja zakończenia połączenia przez naciśnięcie przycisku power
            // (w praktyce trudno programowo zakończyć połączenie bez root)
            const command = 'adb shell input keyevent KEYCODE_ENDCALL';
            await execPromise(command);

            this.isCallActive = false;
            this.currentCallNumber = null;

            return {
                success: true,
                message: 'Połączenie zakończone'
            };

        } catch (error) {
            console.error('Błąd kończenia połączenia:', error.message);
            return {
                success: false,
                message: 'Nie udało się zakończyć połączenia. Rozłącz ręcznie na telefonie.'
            };
        }
    }

    /**
     * Zwraca status telefonu i połączenia
     */
    async getStatus() {
        const adbInstalled = await this.checkADBInstalled();
        const phoneStatus = await this.checkPhoneConnected();

        return {
            adbInstalled,
            phoneConnected: phoneStatus.connected,
            phoneMessage: phoneStatus.message,
            deviceId: phoneStatus.deviceId || null,
            isCallActive: this.isCallActive,
            currentCallNumber: this.currentCallNumber
        };
    }
}

module.exports = USBPhoneManager;
