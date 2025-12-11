const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../database');
const authService = require('../auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const recordingsDir = path.join(__dirname, '..', '..', 'data', 'recordings');
        cb(null, recordingsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const userId = req.user.userId;
        const contactId = req.body.contactId || 'unknown';
        const filename = `recording_${userId}_${contactId}_${timestamp}.webm`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Tylko pliki audio/video są dozwolone'));
        }
    }
});

// Upload recording
router.post('/upload', authService.middleware(), upload.single('recording'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Brak pliku nagrania'
            });
        }

        const { contactId } = req.body;
        const recordingPath = `/recordings/${req.file.filename}`;

        // Update contact with recording path
        if (contactId) {
            database.run(
                `UPDATE contacts SET recording_path = ? WHERE id = ? AND user_id = ?`,
                [recordingPath, contactId, req.user.userId]
            );
        }

        res.json({
            success: true,
            recordingPath: recordingPath,
            filename: req.file.filename,
            size: req.file.size,
            message: 'Nagranie zapisane'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get recording
router.get('/:filename', authService.middleware(), (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', '..', 'data', 'recordings', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Nagranie nie znalezione'
            });
        }

        // Verify user has access to this recording
        const userId = req.user.userId;
        if (!filename.includes(`_${userId}_`)) {
            return res.status(403).json({
                success: false,
                message: 'Brak dostępu do tego nagrania'
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete recording
router.delete('/:filename', authService.middleware(), (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', '..', 'data', 'recordings', filename);

        // Verify user has access to this recording
        const userId = req.user.userId;
        if (!filename.includes(`_${userId}_`)) {
            return res.status(403).json({
                success: false,
                message: 'Brak dostępu do tego nagrania'
            });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'Nagranie usunięte'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// List recordings for contact
router.get('/contact/:contactId', authService.middleware(), async (req, res) => {
    try {
        const contact = database.get(
            `SELECT recording_path FROM contacts WHERE id = ? AND user_id = ?`,
            [req.params.contactId, req.user.userId]
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Kontakt nie znaleziony'
            });
        }

        res.json({
            success: true,
            recordingPath: contact.recording_path
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;