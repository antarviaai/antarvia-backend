// antarvia-backend/index.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/authMiddleware');
const MaintenanceRequest = require('./models/MaintenanceRequest');

const app = express();
const PORT = 5001;
const JWT_SECRET = 'your-super-secret-key-that-should-be-long-and-random';

app.use(cors());
app.use(express.json());

const dbConnectionString = 'mongodb+srv://antarviaai_db_user:93oqP8791wl3CdBI@antarviacluster.3mxvpgu.mongodb.net/test?retryWrites=true&w=majority&appName=AntarviaCluster';

mongoose.connect(dbConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- ✨ UPDATED User Model ✨ ---
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  building: { type: String, required: true },
  unitNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Rejected'],
    default: 'Pending'
  },
  registeredDate: {
    type: Date,
    default: Date.now
  }
});
const User = mongoose.model('User', userSchema);


// --- ✨ UPDATED REGISTRATION ROUTE ✨ ---
app.post('/api/users/register', async (req, res) => {
  try {
    // Now we get all the new fields from the body
    const { firstName, lastName, email, password, building, unitNumber } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email has already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      building,
      unitNumber
      // The 'status' will automatically be 'Pending' by default
    });

    await newUser.save();
    
    // Send a new success message
    res.status(201).json({ message: 'Registration successful! Your account is now pending approval from management.' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});


// --- OTHER ROUTES ---
app.post('/api/users/login', async (req, res) => { /* ... existing code ... */ });
app.get('/api/users/profile', authMiddleware, async (req, res) => { /* ... existing code ... */ });
app.post('/api/requests', authMiddleware, async (req, res) => { /* ... existing code ... */ });
app.get('/api/requests', authMiddleware, async (req, res) => { /* ... existing code ... */ });


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});