const nodemailer = require('nodemailer');

// --- CONFIGURATION: Port 587 (TLS) with IPv4 ---
// Port 587 is the standard submission port and works best on cloud servers like Render.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Must be false for port 587 (it uses STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false // Helps avoid SSL handshake errors on cloud servers
  },
  family: 4 // ⚠️ CRITICAL: Forces IPv4. Prevents IPv6 connection timeouts.
});

// 1. Send Ticket (Booking Confirmation)
const sendTicket = async (to, name, token, link) => {
  try {
    console.log(`📧 Attempting to send ticket to ${to}...`);
    
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

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    // We log the error but do NOT throw it, so the server keeps running
    console.error(`❌ Email Failed (Ticket):`, error.message);
  }
};

// 2. Send Prescription PDF
const sendPrescriptionEmail = async (to, name, pdfBuffer) => {
  try {
    console.log(`📧 Attempting to send prescription to ${to}...`);

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
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Prescription sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Email Failed (Prescription):`, error.message);
  }
};

module.exports = { sendTicket, sendPrescriptionEmail };