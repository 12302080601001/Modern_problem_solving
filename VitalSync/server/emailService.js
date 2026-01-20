const nodemailer = require('nodemailer');

// --- CONFIGURATION (FIXED FOR RENDER IPV4) ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // ⚠️ CRITICAL FIX: Force IPv4. Render/Docker sometimes fails with IPv6.
  family: 4, 
  // Increase timeouts to 30 seconds to be safe
  connectionTimeout: 30000, 
  greetingTimeout: 30000,
  socketTimeout: 30000
});

// 1. Send Ticket (Booking Confirmation)
const sendTicket = async (to, name, token, link) => {
  try {
    console.log(`📧 Preparing to send ticket to ${to}...`);
    
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
    
    // Verify connection before sending (Optional debugging)
    await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
            if (error) {
                console.log("❌ SMTP Connection Check Failed:", error.message);
                reject(error);
            } else {
                console.log("✅ SMTP Connection Established");
                resolve(success);
            }
        });
    });

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Transporter Error (Ticket):`, error.message);
    throw error;
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
          content: pdfBuffer, 
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