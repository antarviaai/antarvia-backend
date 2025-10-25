const express = require('express');
const router = express.Router();
const MaintenanceRequest = require('../models/MaintenanceRequest'); // Import the model we just created

// @route   GET /api/maintenance
// @desc    Get all maintenance requests
// @access  Private (for management)
router.get('/', async (req, res) => {
    try {
        // Find all requests and sort by newest first
        // .populate() gets the user's name and unit from the 'User' collection
        const requests = await MaintenanceRequest.find()
            .populate('submittedBy', 'name') 
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/maintenance/:id
// @desc    Update a maintenance ticket (assign, change status, etc.)
// @access  Private (for management)
router.put('/:id', async (req, res) => {
    // Get the data from the request body
    const { urgency, assignedTo, status, internalNote } = req.body;

    // Build the fields to update
    const updateFields = {};
    if (urgency) updateFields.urgency = urgency;
    if (assignedTo) updateFields.assignedTo = assignedTo;
    if (status) updateFields.status = status;
    if (status === 'Completed') updateFields.completedAt = Date.now();

    try {
        let request = await MaintenanceRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Handle adding a new internal note if one was provided
        if (internalNote) {
            const newNote = {
                note: internalNote,
                // author: req.user.id // We'll get this from auth middleware later
            };
            request.internalNotes.unshift(newNote);
        }

        // Update the basic fields
        request = await MaintenanceRequest.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true } // This option returns the document after it has been updated
        );

        // Save the request again to include the new note
        await request.save();

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;