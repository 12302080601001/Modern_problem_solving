const nodemailer = require('nodemailer');

// --- CONFIGURATION (FIXED FOR RENDER) ---
// We use Port 465 (SSL) which is more reliable on cloud servers than the default 'service: gmail'
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,               // 465 is the Secure SSL port
  secure: true,            // Must be true for port 465
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // Your App Password
  },
  // These settings prevent the server from hanging forever if Gmail is slow
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,    // 5 seconds
  socketTimeout: 10000      // 10 seconds
});

// 1. Send Ticket (Booking Confirmation)
const sendTicket = async (to, name, token, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Your Appointment Ticket #${token}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2c3e50;">Hello ${name},</h2>
          <p>Your appointment is confirmed!</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">Token Number:</p>
            <h1 style="margin: 5px 0; color: #27ae60;">#${token}</h1>
          </div>
          <p>You can track your status live by clicking the button below:</p>
          <a href="${link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Live Status</a>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">VitalSync Automated System</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Transporter Error (Ticket):`, error.message);
    throw error; // Pass error back to index.js so it can log it
  }
};

// 2. Send Prescription PDF
const sendPrescriptionEmail = async (to, name, pdfBuffer) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Prescription for ${name} - ${new Date().toDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${name},</h2>
          <p>Please find attached your medical prescription from your visit today.</p>
          <p><strong>Get well soon!</strong></p>
          <p><em>VitalSync Clinic</em></p>
        </div>
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
    console.log(`✅ Prescription sent to ${to}`);
  } catch (error) {
    console.error(`❌ Transporter Error (Prescription):`, error.message);
    throw error;
  }
};

module.exports = { sendTicket, sendPrescriptionEmail };