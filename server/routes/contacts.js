const express = require('express');
const router = express.Router();
const database = require('../database');
const authService = require('../auth');

// Get all contacts for current user
router.get('/', authService.middleware(), async (req, res) => {
    try {
        const contacts = await database.all(
            `SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.json({
            success: true,
            contacts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get single contact
router.get('/:id', authService.middleware(), async (req, res) => {
    try {
        const contact = await database.get(
            `SELECT * FROM contacts WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.userId]
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Kontakt nie znaleziony'
            });
        }

        res.json({
            success: true,
            contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create new contact
router.post('/', authService.middleware(), async (req, res) => {
    try {
        const { name, phone, address, postal_code, province } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Nazwa i telefon są wymagane'
            });
        }

        const result = await database.run(
            `INSERT INTO contacts (user_id, name, phone, address, postal_code, province) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.userId, name, phone, address || '', postal_code || '', province || '']
        );

        res.json({
            success: true,
            contactId: result.id,
            message: 'Kontakt utworzony'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update contact
router.put('/:id', authService.middleware(), async (req, res) => {
    try {
        const { name, phone, address, postal_code, province, status, meeting_date, meeting_time, follow_up_date, notes, call_duration } = req.body;

        const result = await database.run(
            `UPDATE contacts SET 
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                postal_code = COALESCE(?, postal_code),
                province = COALESCE(?, province),
                status = COALESCE(?, status),
                meeting_date = COALESCE(?, meeting_date),
                meeting_time = COALESCE(?, meeting_time),
                follow_up_date = COALESCE(?, follow_up_date),
                notes = COALESCE(?, notes),
                call_duration = COALESCE(?, call_duration),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [name, phone, address, postal_code, province, status, meeting_date, meeting_time, follow_up_date, notes, call_duration, req.params.id, req.user.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kontakt nie znaleziony'
            });
        }

        res.json({
            success: true,
            message: 'Kontakt zaktualizowany'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete contact
router.delete('/:id', authService.middleware(), async (req, res) => {
    try {
        const result = await database.run(
            `DELETE FROM contacts WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kontakt nie znaleziony'
            });
        }

        res.json({
            success: true,
            message: 'Kontakt usunięty'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Bulk import contacts
router.post('/import', authService.middleware(), async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowe dane kontaktów'
            });
        }

        let imported = 0;
        for (const contact of contacts) {
            if (contact.name && contact.phone) {
                await database.run(
                    `INSERT INTO contacts (user_id, name, phone, address, postal_code, province) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [req.user.userId, contact.name, contact.phone, contact.address || '', contact.postal_code || '', contact.province || '']
                );
                imported++;
            }
        }

        res.json({
            success: true,
            imported,
            message: `Zaimportowano ${imported} kontaktów`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get statistics
router.get('/stats/summary', authService.middleware(), async (req, res) => {
    try {
        const stats = await database.get(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'MEETING' THEN 1 ELSE 0 END) as meeting,
                SUM(CASE WHEN status = 'CONTACT_ADVISOR' THEN 1 ELSE 0 END) as contact_advisor,
                SUM(CASE WHEN status = 'NOT_INTERESTED' THEN 1 ELSE 0 END) as not_interested,
                SUM(CASE WHEN status = 'FOLLOW_UP' THEN 1 ELSE 0 END) as follow_up,
                SUM(CASE WHEN status = 'NO_ANSWER' THEN 1 ELSE 0 END) as no_answer,
                SUM(CASE WHEN status = 'WRONG_NUMBER' THEN 1 ELSE 0 END) as wrong_number,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
             FROM contacts WHERE user_id = ?`,
            [req.user.userId]
        );

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;