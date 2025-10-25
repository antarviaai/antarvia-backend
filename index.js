// antarvia-backend/index.js - COMPLETE VERSION

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./utils/emailService');
const authMiddleware = require('./middleware/authMiddleware');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const Announcement = require('./models/Announcement');
const announcementRoutes = require('./routes/announcements');
const maintenanceRoutes = require('./routes/maintenance');

const app = express();
const PORT = 5001;
const JWT_SECRET = 'antarvia-secret-key-for-jwt-2025';

app.use('/api/maintenance', maintenanceRoutes);
app.use(cors());
app.use(express.json());

const dbConnectionString = 'mongodb+srv://antarviaai_db_user:93oqP8791wl3CdBI@antarviacluster.3mxvpgu.mongodb.net/test?retryWrites=true&w=majority&appName=AntarviaCluster';

mongoose.connect(dbConnectionString)
  .then(() => console.log('✅ Successfully connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- User Model ---
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  building: { type: String, required: true },
  unitNumber: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Active', 'Rejected'], default: 'Pending' },
  role: { type: String, enum: ['Resident', 'Guard', 'Manager'], default: 'Resident' },
  registeredDate: { type: Date, default: Date.now },
  passwordResetToken: String,
  passwordResetExpires: Date,
});
const User = mongoose.model('User', userSchema);

// --- MIDDLEWARE to check if the user is a Manager ---
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'Manager') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Manager role required.' });
  }
};

// --- ROUTES ---
app.post('/api/users/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, building, unitNumber } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email has already registered.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ firstName, lastName, email, password: hashedPassword, building, unitNumber });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful! Your account is now pending approval from management.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});
app.use('/api/announcements', announcementRoutes);

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is not active. Please wait for management approval.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ message: 'Login successful!', token: token });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

app.get('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { category, location, details, permissionToEnter } = req.body;
    const newRequest = new MaintenanceRequest({ category, location, details, permissionToEnter, user: req.user.id });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating request.' });
  }
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ user: req.user.id }).sort({ submittedDate: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching requests.' });
  }
});

app.post('/api/users/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save();
    await sendPasswordResetEmail(user.email, resetToken);
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() } 
    });
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/announcements', authMiddleware, async (req, res) => {
  try {
    // First, find the logged-in user to determine their building
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Now, find all announcements for that user's building
    const announcements = await Announcement.find({ building: user.building })
      .sort({ createdDate: -1 }) // Sort by newest first
      .populate('author', 'firstName lastName'); // Optional: Get author's name

    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error while fetching announcements.' });
  }
});


// --- ADMIN ROUTES ---
app.get('/api/admin/pending-users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || !manager.building) {
      return res.status(400).json({ message: 'Manager account is not configured with a building.' });
    }
    const pendingUsers = await User.find({ 
      status: 'Pending', 
      building: manager.building 
    }).select('-password');
    res.status(200).json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching pending users.' });
  }
});

app.put('/api/admin/approve-user/:userId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { status: 'Active' }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: `User ${user.email} has been approved.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error while approving user.' });
  }
});

app.post('/api/admin/announcements', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { title, message, priority, targetAudience, status, scheduledFor } = req.body;
    const manager = await User.findById(req.user.id);
    const newAnnouncement = new Announcement({
      title, message, priority, targetAudience, status, scheduledFor,
      author: req.user.id,
      building: manager.building
    });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error while creating announcement.' });
  }
});


app.listen(PORT, '0.0.0.0', () => { // <-- This '0.0.0.0' is the only change
  console.log(`✅ Server is running on port ${PORT} and open to the network`);
});