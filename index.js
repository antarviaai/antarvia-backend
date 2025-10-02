// index.js (backend) - COMPLETE AND FINAL VERSION

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

// --- User Model ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);


// --- ROUTES ---
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ email, password: hashedPassword });
    const savedUser = await newUser.save();
    res.status(201).json({ message: 'User created successfully!', userId: savedUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
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
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { category, location, details, permissionToEnter } = req.body;
    const newRequest = new MaintenanceRequest({
      category, location, details, permissionToEnter,
      user: req.user.id
    });
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ message: 'Server error while creating request.' });
  }
});

// --- ✨ NEW ROUTE TO GET ALL REQUESTS FOR A USER ✨ ---
app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    // Find all requests where the 'user' field matches the logged-in user's ID
    const requests = await MaintenanceRequest.find({ user: req.user.id })
      .sort({ submittedDate: -1 }); // Sort by newest first

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error while fetching requests.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});