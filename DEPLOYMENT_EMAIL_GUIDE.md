# Email Configuration Guide for Digital Ocean Deployment

## Prerequisites

1. A Gmail account for sending emails
2. Two-factor authentication enabled on your Gmail account
3. An "App Password" generated for your application

## Getting an App Password from Gmail

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security"
3. Under "Signing in to Google", click on "2-Step Verification"
4. Scroll to the bottom and click on "App passwords"
5. Select "Other (Custom name)" from the dropdown
6. Enter a name for your app (e.g., "Miller House Studio")
7. Click "Generate"
8. Copy the 16-character password that appears

## Setting Up Environment Variables on Digital Ocean

1. SSH into your Digital Ocean droplet:
   ```
   ssh root@your_droplet_ip
   ```

2. Create or edit your environment variables file:
   ```
   nano /var/www/filter/.env
   ```

3. Add the following lines:
   ```
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

4. Save the file (Ctrl+X, then Y, then Enter)

## Testing Email Functionality

1. Ensure your application is running
2. Test the email functionality by:
   ```
   cd /var/www/filter
   node emailTest.js
   ```

3. Create the test file:
   ```
   nano /var/www/filter/emailTest.js
   ```

4. Add the following content:
   ```javascript
   require('dotenv').config();
   const nodemailer = require('nodemailer');

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
     }
   });

   async function testEmail() {
     try {
       // Verify connection
       await transporter.verify();
       console.log('SMTP connection successful');
       
       // Send test email
       const info = await transporter.sendMail({
         from: `"Miller House Studio" <${process.env.EMAIL_USER}>`,
         to: process.env.EMAIL_USER, // Send to yourself for testing
         subject: "Test Email from Digital Ocean",
         text: "If you're seeing this, your email configuration is working correctly!",
         html: "<p>If you're seeing this, your email configuration is working correctly!</p>"
       });
       
       console.log('Email sent:', info.messageId);
     } catch (error) {
       console.error('Error:', error);
     }
   }

   testEmail();
   ```

## Troubleshooting Common Issues

### "Invalid login" Error
- Make sure you're using an App Password, not your regular Gmail password
- Double-check that the EMAIL_USER and EMAIL_PASS environment variables are correctly set

### "Self-signed certificate" Error
- This is expected with the configuration and won't affect functionality
- The `rejectUnauthorized: false` setting in the TLS options handles this

### Connection Timeout
- Check if your Digital Ocean droplet's outgoing SMTP traffic (port 587) is being blocked
- Run: `telnet smtp.gmail.com 587` to test connectivity

### SMTP Rate Limits
- Gmail has sending limits (500 emails per day for regular accounts)
- If you expect high volume, consider using a dedicated email service like:
  - SendGrid
  - Mailgun
  - Amazon SES

## Switching to Production Email Service

For a production environment with higher volume needs, update the configuration in server.js:

```javascript
// SendGrid example
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey', // SendGrid username is always 'apikey'
    pass: process.env.SENDGRID_API_KEY
  }
});
```

## Email Monitoring

1. Set up monitoring for failed emails with:
   ```javascript
   // In your sendEmail function
   if (!result.success) {
     // Log to file, database, or external monitoring
     fs.appendFileSync('email_errors.log', 
       `${new Date().toISOString()} - Failed to send email to: ${to}, Error: ${result.error}\n`);
   }
   ```

2. Schedule a cron job to check for email failures:
   ```
   crontab -e
   ```
   
   Add:
   ```
   0 * * * * node /var/www/filter/scripts/checkEmailErrors.js
   ``` 