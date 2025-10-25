const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This is the blueprint for our announcement data in the database
const announcementSchema = new Schema({
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    // This links to the User model to know who created the announcement
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }, 
    priority: { 
        type: String, 
        enum: ['Standard', 'Urgent'], 
        default: 'Standard' 
    },
    targetAudience: { 
        type: String, 
        enum: ['all', 'floors', 'groups'], 
        default: 'all' 
    },
    targetDetails: { 
        type: String, // e.g., "5, 8, 1204" for floors or "Pet Owners" for groups
        default: null
    },
    status: { 
        type: String, 
        enum: ['Draft', 'Scheduled', 'Sent'], 
        default: 'Sent' 
    },
    scheduledFor: { 
        type: Date, 
        default: null 
    }
}, { 
    // This automatically adds `createdAt` and `updatedAt` fields
    timestamps: true 
});

module.exports = mongoose.model('Announcement', announcementSchema);