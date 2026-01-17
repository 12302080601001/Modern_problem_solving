const nodemailer = require('nodemailer');

// Configure your email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // Your App Password
  }
});

// 1. Send Ticket (Existing)
const sendTicket = async (to, name, token, link) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Your Appointment Ticket #${token}`,
    html: `
      <h2>Hello ${name},</h2>
      <p>Your appointment is confirmed. Your token number is <strong>#${token}</strong>.</p>
      <p>Track your status live here: <a href="${link}">Track Live</a></p>
    `
  };
  await transporter.sendMail(mailOptions);
};

// 2. ✅ NEW: Send Prescription PDF
const sendPrescriptionEmail = async (to, name, pdfBuffer) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Prescription for ${name} - ${new Date().toDateString()}`,
    html: `
      <h2>Hello ${name},</h2>
      <p>Please find attached your medical prescription from your visit today.</p>
      <p><strong>Get well soon!</strong></p>
      <p><em>Dr. Smith's Clinic</em></p>
    `,
    attachments: [
      {
        filename: `Prescription-${name}.pdf`,
        content: pdfBuffer, // The PDF we generated in memory
        contentType: 'application/pdf'
      }
    ]
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendTicket, sendPrescriptionEmail };