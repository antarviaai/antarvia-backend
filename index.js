const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./utils/emailService');
const authMiddleware = require('./middleware/authMiddleware');
const MaintenanceRequest = require('./models/MaintenanceRequest');

const app = express();
const PORT = 5001;
const JWT_SECRET = '8db2d9f9da55f0b6a02d4b8807f3ba35fcde87f3add20a369e326206b9bbfa40f00083f90f96d3b8f2713d7497a1083f';

app.use(cors());
app.use(express.json());

const dbConnectionString = 'mongodb+srv://antarviaai_db_user:93oqP8791wl3CdBI@antarviacluster.3mxvpgu.mongodb.net/test?retryWrites=true&w=majority&appName=AntarviaCluster';

mongoose.connect(dbConnectionString)
.then(() => console.log('✅ Successfully connected to MongoDB!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- COMPLETE User Model ---
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
registeredDate: { type: Date, default: Date.now },
passwordResetToken: String,
passwordResetExpires: Date,
});
const User = mongoose.model('User', userSchema);


// --- ALL ROUTES ---
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

app.post('/api/users/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) {
return res.status(400).json({ message: 'Invalid credentials.' });
}
// Add a check for user status
if (user.status !== 'Active') {
return res.status(403).json({ message: 'Your account is not active. Please wait for management approval.' });
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
const newRequest = new MaintenanceRequest({ category, location, details, permissionToEnter, user: req.user.id });
const savedRequest = await newRequest.save();
res.status(201).json(savedRequest);
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
user.passwordResetExpires = Date.now() + 3600000; // 1 hour
await user.save();
await sendPasswordResetEmail(user.email, resetToken);
res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
} catch (error) {
console.error('Forgot password error:', error);
res.status(500).json({ message: 'Server error' });
}
});

app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`);
});