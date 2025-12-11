const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const database = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'ccdialer-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
    async register(username, password, email, fullName, role = 'operator') {
        try {
            // Check if user exists
            const existingUser = await database.get(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUser) {
                throw new Error('Użytkownik już istnieje');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert user
            const result = await database.run(
                `INSERT INTO users (username, password_hash, email, full_name, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                [username, passwordHash, email, fullName, role]
            );

            return {
                success: true,
                userId: result.id,
                message: 'Użytkownik utworzony pomyślnie'
            };
        } catch (error) {
            throw error;
        }
    }

    async login(username, password) {
        try {
            // Find user
            const user = await database.get(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (!user) {
                throw new Error('Nieprawidłowy login lub hasło');
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                throw new Error('Nieprawidłowy login lub hasło');
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                }
            };
        } catch (error) {
            throw error;
        }
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Nieprawidłowy token');
        }
    }

    async createSession(userId, deviceType = 'phone') {
        const sessionToken = jwt.sign(
            { userId, deviceType, type: 'session' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await database.run(
            `INSERT INTO sessions (user_id, session_token, device_type, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [userId, sessionToken, deviceType, expiresAt]
        );

        return sessionToken;
    }

    async verifySession(sessionToken) {
        try {
            const decoded = jwt.verify(sessionToken, JWT_SECRET);
            
            const session = await database.get(
                `SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime('now')`,
                [sessionToken]
            );

            if (!session) {
                throw new Error('Sesja wygasła');
            }

            return decoded;
        } catch (error) {
            throw new Error('Nieprawidłowa sesja');
        }
    }

    middleware() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;

                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Brak tokenu autoryzacji'
                    });
                }

                const token = authHeader.substring(7);
                const decoded = this.verifyToken(token);

                req.user = decoded;
                next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Nieprawidłowy token'
                });
            }
        };
    }

    adminMiddleware() {
        return async (req, res, next) => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Brak uprawnień administratora'
                });
            }
            next();
        };
    }
}

module.exports = new AuthService();