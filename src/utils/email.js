const nodemailer = require('nodemailer');

/**
 * Email / OTP Sending Utility
 *
 * EMAIL_MODE=console (default) → Logs OTP to terminal, no SMTP needed.
 * EMAIL_MODE=smtp              → Sends real email via configured SMTP.
 *
 * For Mailtrap (test SMTP, free):
 *   1. Sign up at https://mailtrap.io
 *   2. Go to Inboxes → SMTP Settings
 *   3. Copy credentials into .env
 */

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_MODE === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send an OTP email.
 * Falls back to console.log if EMAIL_MODE is not 'smtp'.
 */
const sendOTPEmail = async ({ to, otp, name = '' }) => {
  const expiresMin = process.env.OTP_EXPIRES_MINUTES || 10;

  const htmlBody = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #4f46e5; border-radius: 12px; padding: 12px 20px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">SmartHR</h1>
        </div>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; margin-top: 0;">Your Login OTP</h2>
        <p style="color: #475569;">Hi ${name || to}, use the code below to sign in to SmartHR:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
          ⏱ This code expires in <strong>${expiresMin} minutes</strong>.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  // Console mode — no SMTP needed (great for dev/demo)
  if (process.env.EMAIL_MODE !== 'smtp') {
    console.log('\n' + '═'.repeat(50));
    console.log(`📧 OTP EMAIL (console mode)`);
    console.log(`   To:   ${to}`);
    console.log(`   OTP:  ${otp}`);
    console.log(`   Exp:  ${expiresMin} minutes`);
    console.log('═'.repeat(50) + '\n');
    return { success: true, mode: 'console' };
  }

  // SMTP mode — real email
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'SmartHR <noreply@smarthr.com>',
    to,
    subject: `Your SmartHR OTP: ${otp}`,
    html: htmlBody,
    text: `Your SmartHR login OTP is: ${otp}\nExpires in ${expiresMin} minutes.`,
  });

  return { success: true, mode: 'smtp' };
};

module.exports = { sendOTPEmail };
