// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'antarvia.ai@gmail.com',
    // Replaced with your new App Password
    pass: 'uyqw dqbh fajw tdcz'
  }
});

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  const mailOptions = {
    from: '"Antarvia Hub" <antarvia.ai@gmail.com>',
    to: userEmail,
    subject: 'Your Password Reset Link for Antarvia Hub',
    html: `
      <p>Hello,</p>
      <p>You requested a password reset for your Antarvia Hub account.</p>
      <p>Please click the link below to set a new password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}" style="background-color: #0077ED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thanks,<br/>The Antarvia Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully.');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = { sendPasswordResetEmail };