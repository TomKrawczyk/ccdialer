const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Create recordings directory
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
fs.mkdir(RECORDINGS_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const date = new Date().toISOString().split('T')[0];
        const dayDir = path.join(RECORDINGS_DIR, date);
        await fs.mkdir(dayDir, { recursive: true });
        cb(null, dayDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const phoneNumber = req.body.phoneNumber || 'unknown';
        const sanitizedPhone = phoneNumber.replace(/[^0-9+]/g, '');
        cb(null, `recording_${sanitizedPhone}_${timestamp}.webm`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// ===================================
// OPTION 1: LOCAL SERVER STORAGE
// ===================================

/**
 * Upload recording to local server
 */
app.post('/api/upload-recording', upload.single('recording'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const metadata = {
            phoneNumber: req.body.phoneNumber || 'unknown',
            contactName: req.body.contactName || 'Unknown',
            duration: parseInt(req.body.duration) || 0,
            timestamp: req.body.timestamp || new Date().toISOString(),
            callStatus: req.body.callStatus || 'unknown',
            fileSize: req.file.size,
            filename: req.file.filename,
            filepath: req.file.path
        };

        // Save metadata
        const metadataPath = req.file.path.replace('.webm', '.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

        console.log(`✅ Recording saved: ${metadata.phoneNumber} (${metadata.duration}s)`);

        res.json({
            success: true,
            message: 'Recording uploaded successfully',
            recordingId: path.basename(req.file.filename, '.webm'),
            metadata: metadata
        });

    } catch (error) {
        console.error('Error uploading recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload recording',
            error: error.message
        });
    }
});

/**
 * Get all recordings
 */
app.get('/api/recordings', async (req, res) => {
    try {
        const recordings = [];
        const days = await fs.readdir(RECORDINGS_DIR);

        for (const day of days) {
            const dayPath = path.join(RECORDINGS_DIR, day);
            const stats = await fs.stat(dayPath);
            
            if (stats.isDirectory()) {
                const files = await fs.readdir(dayPath);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const metadataPath = path.join(dayPath, file);
                        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                        recordings.push({
                            ...metadata,
                            date: day,
                            downloadUrl: `/api/recordings/${day}/${file.replace('.json', '.webm')}`
                        });
                    }
                }
            }
        }

        recordings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            total: recordings.length,
            recordings: recordings
        });

    } catch (error) {
        console.error('Error getting recordings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recordings',
            error: error.message
        });
    }
});

/**
 * Download recording
 */
app.get('/api/recordings/:date/:filename', async (req, res) => {
    try {
        const filePath = path.join(RECORDINGS_DIR, req.params.date, req.params.filename);
        
        // Check if file exists
        await fs.access(filePath);
        
        res.download(filePath);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Recording not found'
        });
    }
});

/**
 * Delete recording
 */
app.delete('/api/recordings/:date/:filename', async (req, res) => {
    try {
        const audioPath = path.join(RECORDINGS_DIR, req.params.date, req.params.filename);
        const metadataPath = audioPath.replace('.webm', '.json');
        
        await fs.unlink(audioPath);
        await fs.unlink(metadataPath);
        
        console.log(`🗑️ Recording deleted: ${req.params.filename}`);
        
        res.json({
            success: true,
            message: 'Recording deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete recording',
            error: error.message
        });
    }
});

// ===================================
// OPTION 2: GOOGLE DRIVE UPLOAD
// ===================================

/**
 * Upload recording to Google Drive
 */
app.post('/api/upload-to-google-drive', upload.single('recording'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        // Google Drive credentials from environment or config
        const credentials = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        };

        if (!credentials.client_id || !credentials.refresh_token) {
            throw new Error('Google Drive credentials not configured');
        }

        const oauth2Client = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret
        );

        oauth2Client.setCredentials({
            refresh_token: credentials.refresh_token
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Create folder structure: Recordings/YYYY-MM-DD
        const date = new Date().toISOString().split('T')[0];
        const folderName = `Recordings/${date}`;
        
        // Upload file
        const fileMetadata = {
            name: req.file.filename,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Your Google Drive folder ID
        };

        const media = {
            mimeType: 'audio/webm',
            body: require('fs').createReadStream(req.file.path)
        };

        const driveFile = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink'
        });

        // Delete local file after upload
        await fs.unlink(req.file.path);

        console.log(`☁️ Uploaded to Google Drive: ${driveFile.data.name}`);

        res.json({
            success: true,
            message: 'Recording uploaded to Google Drive',
            fileId: driveFile.data.id,
            fileUrl: driveFile.data.webViewLink
        });

    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload to Google Drive',
            error: error.message
        });
    }
});

// ===================================
// OPTION 3: AWS S3 UPLOAD (Example)
// ===================================

/**
 * Upload recording to AWS S3
 * Requires: npm install aws-sdk
 */
app.post('/api/upload-to-s3', upload.single('recording'), async (req, res) => {
    try {
        // Example for AWS S3 - you need to install aws-sdk
        // const AWS = require('aws-sdk');
        // const s3 = new AWS.S3({
        //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        // });
        
        // const params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: `recordings/${req.file.filename}`,
        //     Body: require('fs').createReadStream(req.file.path),
        //     ContentType: 'audio/webm'
        // };
        
        // const result = await s3.upload(params).promise();
        
        res.json({
            success: false,
            message: 'AWS S3 upload not configured. See code comments for setup.'
        });

    } catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload to S3',
            error: error.message
        });
    }
});

// ===================================
// STATISTICS & ANALYTICS
// ===================================

/**
 * Get recording statistics
 */
app.get('/api/statistics', async (req, res) => {
    try {
        const recordings = [];
        const days = await fs.readdir(RECORDINGS_DIR);

        for (const day of days) {
            const dayPath = path.join(RECORDINGS_DIR, day);
            const stats = await fs.stat(dayPath);
            
            if (stats.isDirectory()) {
                const files = await fs.readdir(dayPath);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const metadata = JSON.parse(
                            await fs.readFile(path.join(dayPath, file), 'utf-8')
                        );
                        recordings.push(metadata);
                    }
                }
            }
        }

        // Calculate statistics
        const stats = {
            totalRecordings: recordings.length,
            totalDuration: recordings.reduce((sum, r) => sum + r.duration, 0),
            totalSize: recordings.reduce((sum, r) => sum + r.fileSize, 0),
            averageDuration: recordings.length > 0 
                ? recordings.reduce((sum, r) => sum + r.duration, 0) / recordings.length 
                : 0,
            recordingsByStatus: {},
            recordingsByDate: {}
        };

        // Group by status
        recordings.forEach(r => {
            stats.recordingsByStatus[r.callStatus] = 
                (stats.recordingsByStatus[r.callStatus] || 0) + 1;
        });

        // Group by date
        recordings.forEach(r => {
            const date = r.timestamp.split('T')[0];
            stats.recordingsByDate[date] = (stats.recordingsByDate[date] || 0) + 1;
        });

        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// ===================================
// SEARCH & FILTER
// ===================================

/**
 * Search recordings by phone number or contact name
 */
app.get('/api/recordings/search', async (req, res) => {
    try {
        const { query, startDate, endDate, status } = req.query;
        
        const recordings = [];
        const days = await fs.readdir(RECORDINGS_DIR);

        for (const day of days) {
            // Filter by date range
            if (startDate && day < startDate) continue;
            if (endDate && day > endDate) continue;

            const dayPath = path.join(RECORDINGS_DIR, day);
            const stats = await fs.stat(dayPath);
            
            if (stats.isDirectory()) {
                const files = await fs.readdir(dayPath);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const metadata = JSON.parse(
                            await fs.readFile(path.join(dayPath, file), 'utf-8')
                        );

                        // Filter by search query
                        if (query) {
                            const searchLower = query.toLowerCase();
                            if (!metadata.phoneNumber.includes(query) && 
                                !metadata.contactName.toLowerCase().includes(searchLower)) {
                                continue;
                            }
                        }

                        // Filter by status
                        if (status && metadata.callStatus !== status) {
                            continue;
                        }

                        recordings.push({
                            ...metadata,
                            date: day,
                            downloadUrl: `/api/recordings/${day}/${file.replace('.json', '.webm')}`
                        });
                    }
                }
            }
        }

        recordings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            total: recordings.length,
            recordings: recordings
        });

    } catch (error) {
        console.error('Error searching recordings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search recordings',
            error: error.message
        });
    }
});

// ===================================
// HEALTH CHECK
// ===================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Recording Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎙️  Recording Server running on http://localhost:${PORT}`);
    console.log(`📁 Recordings stored in: ${RECORDINGS_DIR}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST   /api/upload-recording           - Upload to local server`);
    console.log(`   POST   /api/upload-to-google-drive    - Upload to Google Drive`);
    console.log(`   POST   /api/upload-to-s3              - Upload to AWS S3`);
    console.log(`   GET    /api/recordings                - Get all recordings`);
    console.log(`   GET    /api/recordings/search         - Search recordings`);
    console.log(`   GET    /api/statistics                - Get statistics`);
    console.log(`   DELETE /api/recordings/:date/:file    - Delete recording`);
    console.log(`\n💡 Configure Google Drive:`);
    console.log(`   Set environment variables:`);
    console.log(`   - GOOGLE_CLIENT_ID`);
    console.log(`   - GOOGLE_CLIENT_SECRET`);
    console.log(`   - GOOGLE_REFRESH_TOKEN`);
    console.log(`   - GOOGLE_DRIVE_FOLDER_ID`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down Recording Server...');
    process.exit(0);
});
