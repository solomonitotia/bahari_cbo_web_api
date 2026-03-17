const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp, type) => {
  const transporter = createTransporter();

  const subjects = {
    email_verify: 'Verify Your Email - Bahari CBO',
    login_2fa: 'Your Login OTP - Bahari CBO',
    password_reset: 'Password Reset OTP - Bahari CBO',
  };

  const descriptions = {
    email_verify: 'verify your email address',
    login_2fa: 'complete your login',
    password_reset: 'reset your password',
  };

  const subject = subjects[type] || 'OTP - Bahari CBO';
  const description = descriptions[type] || 'complete your action';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #0ea5e9; padding: 24px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; }
        .body { padding: 32px; }
        .otp-box { background: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; }
        .note { color: #6b7280; font-size: 13px; text-align: center; }
        .footer { background: #f9fafb; padding: 16px; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 Bahari CBO</h1>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p>Use the OTP below to <strong>${description}</strong>. This code expires in <strong>${process.env.OTP_EXPIRES_MINUTES || 5} minutes</strong>.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="note">Do not share this OTP with anyone. Bahari CBO staff will never ask for your OTP.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Bahari CBO. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
};

module.exports = { sendOTPEmail };
