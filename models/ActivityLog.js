const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityLogSchema = new Schema({
    // Who performed the action
    guard: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // What kind of action it was
    activityType: {
        type: String,
        enum: ['Package Logged', 'Incident Report', 'Patrol Checkpoint', 'Task Completed'],
        required: true
    },
    // A detailed description of the action
    details: {
        type: String,
        required: true
    },
    // Optional reference to another document, e.g., a MaintenanceRequest ID
    referenceId: {
        type: String
    }
}, { 
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);