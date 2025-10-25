const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const maintenanceRequestSchema = new Schema({
    // Information from the resident
    submittedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    unitNumber: {
        type: String,
        required: true
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    photos: [{ // An array to hold URLs of uploaded photos
        type: String 
    }],

    // Information added by management
    status: {
        type: String,
        enum: ['New', 'In Progress', 'Completed', 'Cancelled'],
        default: 'New'
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    assignedTo: { // Will link to a Staff or User model
        type: Schema.Types.ObjectId,
        ref: 'User' 
    },
    internalNotes: [{
        note: String,
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Timestamps
    completedAt: {
        type: Date
    }
}, { 
    timestamps: true // Adds `createdAt` and `updatedAt` automatically
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);