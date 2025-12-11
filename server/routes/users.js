const express = require('express');
const router = express.Router();
const database = require('../database');
const authService = require('../auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Login i hasło są wymagane'
            });
        }

        const result = await authService.login(username, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

// Register (admin only)
router.post('/register', authService.middleware(), authService.adminMiddleware(), async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Login i hasło są wymagane'
            });
        }

        const result = await authService.register(username, password, email, fullName, role);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get current user info
router.get('/me', authService.middleware(), async (req, res) => {
    try {
        const user = await database.get(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all users (admin only)
router.get('/', authService.middleware(), authService.adminMiddleware(), async (req, res) => {
    try {
        const users = await database.all(
            'SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create phone session (for QR code login)
router.post('/phone-session', authService.middleware(), async (req, res) => {
    try {
        const sessionToken = await authService.createSession(req.user.userId, 'phone');

        res.json({
            success: true,
            sessionToken,
            message: 'Sesja telefonu utworzona'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Verify phone session
router.post('/verify-session', async (req, res) => {
    try {
        const { sessionToken } = req.body;

        if (!sessionToken) {
            return res.status(400).json({
                success: false,
                message: 'Token sesji jest wymagany'
            });
        }

        const decoded = await authService.verifySession(sessionToken);

        const user = await database.get(
            'SELECT id, username, full_name FROM users WHERE id = ?',
            [decoded.userId]
        );

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;