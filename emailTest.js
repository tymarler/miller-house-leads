require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Starting email test...');
console.log(`Using email: ${process.env.EMAIL_USER}`);

// Create a testing transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

async function testEmail() {
  try {
    // First verify SMTP connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    // Then send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Miller House Studio" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Email Test from Digital Ocean Deployment",
      text: "If you're seeing this, your email configuration is working correctly!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #2c5282;">Email Configuration Test</h2>
          <p>If you're seeing this, your email configuration is working correctly!</p>
          <p>This email was sent from your Digital Ocean deployment.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #718096;">
            This is an automated test. Time sent: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('❌ Error during email test:');
    console.error('Error message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\nAuthentication error. Please check:');
      console.error('1. You are using an app password (not your regular password)');
      console.error('2. 2FA is enabled on your Google account');
      console.error('3. Environment variables are correctly set');
    } else if (error.code === 'ESOCKET') {
      console.error('\nConnection error. Please check:');
      console.error('1. Your firewall settings allow outgoing SMTP traffic');
      console.error('2. Port 587 is not blocked on your server');
      console.error('3. Run: telnet smtp.gmail.com 587 to test connectivity');
    }
    
    console.error('\nFull error details:', error);
  } finally {
    console.log('\nTest completed.');
  }
}

testEmail(); 