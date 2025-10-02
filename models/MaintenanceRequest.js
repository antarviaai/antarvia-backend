// models/MaintenanceRequest.js
const mongoose = require('mongoose');

const MaintenanceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  permissionToEnter: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Completed'],
    default: 'Submitted',
  },
  submittedDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);