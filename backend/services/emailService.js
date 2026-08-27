const nodemailer = require('nodemailer');

/**
 * Send email service utility
 * @param {Object} options - Email options { email, subject, message, html }
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'E-Commerce App'} <${process.env.FROM_EMAIL || 'noreply@ecommerceapp.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || process.env.SMTP_USER === 'dev_user')) {
    console.log(`[Email Service Mock] Email to: ${options.email} | Subject: ${options.subject}`);
    console.log(`[Message Body]: ${options.message}`);
    return true;
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
