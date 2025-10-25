const express = require('express');
const router = express.Router();
// This line imports your blueprint
const Announcement = require('../models/Announcement');

// @route   POST /api/announcements
// @desc    Create a new announcement
// This handles the request from your frontend form
router.post('/', async (req, res) => {
    try {
        const {
            title,
            message,
            priority,
            targetAudience,
            targetDetails
        } = req.body;

        const newAnnouncement = new Announcement({
            title,
            message,
            priority,
            targetAudience,
            targetDetails,
            // author will be added later with authentication
        });

        // Save the new announcement to MongoDB
        const announcement = await newAnnouncement.save();

        // Send a success response back to the frontend
        res.status(201).json(announcement);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    router.get('/', async (req, res) => {
        try {
            // Find all announcements and sort them by creation date (newest first)
            const announcements = await Announcement.find().sort({ createdAt: -1 });
            res.json(announcements);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });
});

module.exports = router;