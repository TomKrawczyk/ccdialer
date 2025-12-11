const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure recordings directory exists
const recordingsDir = path.join(__dirname, '..', 'data', 'recordings');
if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
}

class DatabaseManager {
    constructor() {
        this.db = {
            users: [],
            contacts: [],
            call_logs: [],
            sessions: []
        };
        this.nextId = {
            users: 1,
            contacts: 1,
            call_logs: 1,
            sessions: 1
        };
    }

    async initialize() {
        // Load existing database or create new
        if (fs.existsSync(DB_PATH)) {
            const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            this.db = data.db;
            this.nextId = data.nextId;
            console.log('✅ Baza danych załadowana');
        } else {
            await this.createDefaultAdmin();
            this.save();
            console.log('✅ Nowa baza danych utworzona');
        }
        return this;
    }

    save() {
        fs.writeFileSync(DB_PATH, JSON.stringify({ db: this.db, nextId: this.nextId }, null, 2));
    }

    async createDefaultAdmin() {
        const bcrypt = require('bcrypt');
        const username = 'admin';
        const password = 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);

        this.db.users.push({
            id: this.nextId.users++,
            username,
            password_hash: passwordHash,
            email: null,
            full_name: 'Administrator',
            role: 'admin',
            created_at: new Date().toISOString()
        });

        console.log('✅ Domyślny użytkownik admin utworzony (login: admin, hasło: admin123)');
    }

    run(sql, params = []) {
        // Simple SQL parser for INSERT/UPDATE/DELETE
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.startsWith('insert into users')) {
            const user = {
                id: this.nextId.users++,
                username: params[0],
                password_hash: params[1],
                email: params[2] || null,
                full_name: params[3] || null,
                role: params[4] || 'operator',
                created_at: new Date().toISOString()
            };
            this.db.users.push(user);
            this.save();
            return { id: user.id, changes: 1 };
        }
        
        if (sqlLower.startsWith('insert into contacts')) {
            const contact = {
                id: this.nextId.contacts++,
                user_id: params[0],
                name: params[1],
                phone: params[2],
                address: params[3] || '',
                postal_code: params[4] || '',
                province: params[5] || '',
                status: 'PENDING',
                meeting_date: null,
                meeting_time: null,
                follow_up_date: null,
                notes: null,
                call_duration: 0,
                recording_path: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.db.contacts.push(contact);
            this.save();
            return { id: contact.id, changes: 1 };
        }
        
        if (sqlLower.startsWith('update contacts')) {
            const contactId = params[params.length - 2];
            const userId = params[params.length - 1];
            const contact = this.db.contacts.find(c => c.id == contactId && c.user_id == userId);
            
            if (contact) {
                // Update fields
                if (params[0] !== undefined && params[0] !== null) contact.name = params[0];
                if (params[1] !== undefined && params[1] !== null) contact.phone = params[1];
                if (params[2] !== undefined && params[2] !== null) contact.address = params[2];
                if (params[3] !== undefined && params[3] !== null) contact.postal_code = params[3];
                if (params[4] !== undefined && params[4] !== null) contact.province = params[4];
                if (params[5] !== undefined && params[5] !== null) contact.status = params[5];
                if (params[6] !== undefined && params[6] !== null) contact.meeting_date = params[6];
                if (params[7] !== undefined && params[7] !== null) contact.meeting_time = params[7];
                if (params[8] !== undefined && params[8] !== null) contact.follow_up_date = params[8];
                if (params[9] !== undefined && params[9] !== null) contact.notes = params[9];
                if (params[10] !== undefined && params[10] !== null) contact.call_duration = params[10];
                
                contact.updated_at = new Date().toISOString();
                this.save();
                return { changes: 1 };
            }
            return { changes: 0 };
        }
        
        if (sqlLower.includes('update contacts') && sqlLower.includes('recording_path')) {
            const recordingPath = params[0];
            const contactId = params[1];
            const userId = params[2];
            const contact = this.db.contacts.find(c => c.id == contactId && c.user_id == userId);
            
            if (contact) {
                contact.recording_path = recordingPath;
                contact.updated_at = new Date().toISOString();
                this.save();
                return { changes: 1 };
            }
            return { changes: 0 };
        }
        
        if (sqlLower.startsWith('delete from contacts')) {
            const contactId = params[0];
            const userId = params[1];
            const index = this.db.contacts.findIndex(c => c.id == contactId && c.user_id == userId);
            
            if (index !== -1) {
                this.db.contacts.splice(index, 1);
                this.save();
                return { changes: 1 };
            }
            return { changes: 0 };
        }
        
        if (sqlLower.startsWith('insert into sessions')) {
            const session = {
                id: this.nextId.sessions++,
                user_id: params[0],
                session_token: params[1],
                device_type: params[2],
                created_at: new Date().toISOString(),
                expires_at: params[3]
            };
            this.db.sessions.push(session);
            this.save();
            return { id: session.id, changes: 1 };
        }
        
        return { changes: 0 };
    }

    get(sql, params = []) {
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.includes('from users where username')) {
            return this.db.users.find(u => u.username === params[0]);
        }
        
        if (sqlLower.includes('from users where id')) {
            return this.db.users.find(u => u.id == params[0]);
        }
        
        if (sqlLower.includes('from contacts where id') && params.length === 2) {
            return this.db.contacts.find(c => c.id == params[0] && c.user_id == params[1]);
        }
        
        if (sqlLower.includes('from sessions where session_token')) {
            const now = new Date().toISOString();
            return this.db.sessions.find(s => s.session_token === params[0] && s.expires_at > now);
        }
        
        if (sqlLower.includes('count(*) as total')) {
            const userId = params[0];
            const userContacts = this.db.contacts.filter(c => c.user_id == userId);
            
            return {
                total: userContacts.length,
                completed: userContacts.filter(c => c.status === 'COMPLETED').length,
                meeting: userContacts.filter(c => c.status === 'MEETING').length,
                contact_advisor: userContacts.filter(c => c.status === 'CONTACT_ADVISOR').length,
                not_interested: userContacts.filter(c => c.status === 'NOT_INTERESTED').length,
                follow_up: userContacts.filter(c => c.status === 'FOLLOW_UP').length,
                no_answer: userContacts.filter(c => c.status === 'NO_ANSWER').length,
                wrong_number: userContacts.filter(c => c.status === 'WRONG_NUMBER').length,
                pending: userContacts.filter(c => c.status === 'PENDING' || !c.status).length
            };
        }
        
        return null;
    }

    all(sql, params = []) {
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.includes('from contacts where user_id')) {
            return this.db.contacts.filter(c => c.user_id == params[0]);
        }
        
        if (sqlLower.includes('from users order by')) {
            return this.db.users.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                full_name: u.full_name,
                role: u.role,
                created_at: u.created_at
            }));
        }
        
        return [];
    }

    close() {
        this.save();
        console.log('✅ Baza danych zapisana');
    }
}

module.exports = new DatabaseManager();