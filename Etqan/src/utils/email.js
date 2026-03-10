const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!config.smtp?.host) {
    console.warn('SMTP not configured. OTP emails will be logged only.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
};

const sendOtpEmail = async (to, code, type = 'EMAIL_VERIFICATION') => {
  const subject = type === 'EMAIL_VERIFICATION' ? 'Verify your email - Etqan' : `Your OTP - Etqan`;
  const html = `
    <p>Your verification code is: <strong>${code}</strong></p>
    <p>This code expires in ${config.otp.expiryMinutes} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  const transport = getTransporter();
  if (transport) {
    await transport.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
  } else {
    console.log('[EMAIL] OTP:', { to, code, type });
  }
};

module.exports = { sendOtpEmail, getTransporter };
