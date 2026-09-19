import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface SendVerificationEmailOptions {
  email: string;
  otp: string;
  name?: string;
}

export interface SendPasswordResetEmailOptions {
  email: string;
  otp: string;
  name?: string;
}

const SITE_URL = 'https://vibemeetchat.vercel.app';

const getLogoAttachment = () => {
  const logoPath = path.resolve(__dirname, '../../assets/vibemeet-email-logo.jpg');
  if (fs.existsSync(logoPath)) {
    return [
      {
        filename: 'vibemeet-logo.jpg',
        path: logoPath,
        cid: 'vibemeetLogo'
      }
    ];
  }
  return [];
};

export const generateVerificationEmailHtml = (otp: string, name?: string): string => {
  const greetingName = name ? name.trim() : 'Friend';
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your VibeMeet Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .email-container {
      max-width: 580px;
      margin: 30px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(236, 72, 153, 0.15);
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%);
      padding: 32px 20px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-logo-img {
      max-width: 210px;
      width: 100%;
      height: auto;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(236, 72, 153, 0.3);
    }
    .body-content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .message-text {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.08));
      border: 1px solid rgba(236, 72, 153, 0.35);
      border-radius: 18px;
      padding: 24px;
      text-align: center;
      margin-bottom: 28px;
      box-shadow: inset 0 0 20px rgba(236, 72, 153, 0.05);
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #f472b6;
      margin-bottom: 10px;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #ffffff;
      margin: 4px 0;
      text-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
    }
    .otp-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .info-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 20px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .info-box strong {
      color: #e2e8f0;
    }
    .footer-section {
      padding: 24px 32px;
      background-color: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      
      <!-- Header Banner with Official VibeMeet 3D Artwork -->
      <div class="header-banner">
        <img src="cid:vibemeetLogo" alt="VibeMeet - No Swipes. Just Connections." class="header-logo-img" />
      </div>

      <!-- Main Body Content -->
      <div class="body-content">
        <div class="greeting">Hello ${greetingName}! 👋</div>
        <div class="message-text">
          Welcome to <strong>VibeMeet</strong>! We are excited to have you join our verified community.
          To confirm your email address and start meeting compatible people face-to-face, please use the verification code below:
        </div>

        <!-- Eye-Catching OTP Display -->
        <div class="otp-card">
          <div class="otp-label">One-Time Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Valid for 10 minutes from request</div>
        </div>

        <!-- Security Notice -->
        <div class="info-box">
          🛡️ <strong>Security Tip:</strong> Never share this code with anyone. VibeMeet will never ask for your password or verification code. If you did not request this code, you can safely ignore this email.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <a href="${SITE_URL}" style="display: inline-block; margin-bottom: 16px; padding: 12px 28px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 50px; letter-spacing: 0.5px;">🚀 Visit VibeMeet</a>
        <p style="margin: 0 0 10px 0;">
          Need assistance or having issues? Reach our team directly at 
          <a href="mailto:logiterax@gmail.com" style="color: #f472b6; font-weight: 600; text-decoration: none;">logiterax@gmail.com</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #475569;">
          &copy; ${currentYear} VibeMeet Inc. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
};

export const generatePasswordResetEmailHtml = (otp: string, name?: string): string => {
  const greetingName = name ? name.trim() : 'there';
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your VibeMeet Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .email-container {
      max-width: 580px;
      margin: 30px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.15);
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%);
      padding: 32px 20px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-logo-img {
      max-width: 210px;
      width: 100%;
      height: auto;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(236, 72, 153, 0.3);
    }
    .body-content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .message-text {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 18px;
      padding: 24px;
      text-align: center;
      margin-bottom: 28px;
      box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.05);
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #a78bfa;
      margin-bottom: 10px;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #ffffff;
      margin: 4px 0;
      text-shadow: 0 0 15px rgba(167, 139, 250, 0.5);
    }
    .otp-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .info-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 20px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .info-box strong {
      color: #e2e8f0;
    }
    .footer-section {
      padding: 24px 32px;
      background-color: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      
      <!-- Header Banner with Official VibeMeet 3D Artwork -->
      <div class="header-banner">
        <img src="cid:vibemeetLogo" alt="VibeMeet - No Swipes. Just Connections." class="header-logo-img" />
      </div>

      <!-- Main Body Content -->
      <div class="body-content">
        <div class="greeting">Hello ${greetingName}! 👋</div>
        <div class="message-text">
          We received a request to reset your password for your <strong>VibeMeet</strong> account.
          Use the 6-digit verification code below to authorize your password change:
        </div>

        <!-- Eye-Catching OTP Display -->
        <div class="otp-card">
          <div class="otp-label">Password Reset Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Valid for 10 minutes from request</div>
        </div>

        <!-- Security Notice -->
        <div class="info-box">
          🛡️ <strong>Important Security Tip:</strong> If you did not request a password reset, you can safely ignore this email. Your current password remains completely secure and no changes were made.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <a href="${SITE_URL}" style="display: inline-block; margin-bottom: 16px; padding: 12px 28px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 50px; letter-spacing: 0.5px;">🚀 Visit VibeMeet</a>
        <p style="margin: 0 0 10px 0;">
          Need assistance or suspect suspicious activity? Reach our team directly at 
          <a href="mailto:logiterax@gmail.com" style="color: #f472b6; font-weight: 600; text-decoration: none;">logiterax@gmail.com</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #475569;">
          &copy; ${currentYear} VibeMeet Inc. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
};

export const sendVerificationEmail = async ({ email, otp, name }: SendVerificationEmailOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Email delivery is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM to backend/.env.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const htmlContent = generateVerificationEmailHtml(otp, name);
  const textContent = `Hello ${name || 'there'},\n\nWelcome to VibeMeet!\n\nYour 6-digit verification code is: ${otp}\nThis code expires in 10 minutes.\n\nIf you did not request this code, you can safely ignore this message.\nNeed help? Contact logiterax@gmail.com\n\n© ${new Date().getFullYear()} VibeMeet Inc.`;

  await transporter.sendMail({
    from: `"VibeMeet" <${SMTP_FROM}>`,
    to: email,
    subject: `Your VibeMeet Verification Code: ${otp}`,
    text: textContent,
    html: htmlContent,
    attachments: getLogoAttachment()
  });
};

export const sendPasswordResetEmail = async ({ email, otp, name }: SendPasswordResetEmailOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Email delivery is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM to backend/.env.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const htmlContent = generatePasswordResetEmailHtml(otp, name);
  const textContent = `Hello ${name || 'there'},\n\nWe received a request to reset your VibeMeet password.\n\nYour 6-digit verification code is: ${otp}\nThis code expires in 10 minutes.\n\nIf you did not request this change, please ignore this email.\nNeed help? Contact logiterax@gmail.com\n\n© ${new Date().getFullYear()} VibeMeet Inc.`;

  await transporter.sendMail({
    from: `"VibeMeet Security" <${SMTP_FROM}>`,
    to: email,
    subject: `Your VibeMeet Password Reset Code: ${otp}`,
    text: textContent,
    html: htmlContent,
    attachments: getLogoAttachment()
  });
};

export interface SendAutoResponderOptions {
  email: string;
  name: string;
  subject: string;
  message: string;
}

export const generateAutoResponderEmailHtml = ({ name, subject, message }: SendAutoResponderOptions): string => {
  const currentYear = new Date().getFullYear();
  const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Message - VibeMeet Support</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 580px; margin: 30px auto;
      background-color: #0f172a; border: 1px solid #1e293b;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(236, 72, 153, 0.15);
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%);
      padding: 32px 20px 24px; text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-logo-img {
      max-width: 210px; width: 100%; height: auto;
      border-radius: 20px; display: inline-block;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(236, 72, 153, 0.3);
    }
    .body-content { padding: 36px 32px; }
    .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
    .message-text { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .summary-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(236, 72, 153, 0.25);
      border-radius: 16px; padding: 20px;
      margin-bottom: 24px;
    }
    .summary-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #f472b6; font-weight: 700; margin-bottom: 8px; }
    .summary-subject { font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
    .summary-body { font-size: 13px; color: #cbd5e1; line-height: 1.5; font-style: italic; }
    .badge-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 14px; padding: 14px 18px;
      font-size: 13px; color: #6ee7b7; margin-bottom: 24px;
    }
    .footer-section {
      padding: 24px 32px; background-color: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center; font-size: 12px; color: #64748b;
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      <div class="header-banner">
        <img src="cid:vibemeetLogo" alt="VibeMeet - No Swipes. Just Connections." class="header-logo-img" />
      </div>
      <div class="body-content">
        <div class="greeting">Hello ${name || 'there'}! 👋</div>
        <div class="message-text">
          Thank you for contacting <strong>VibeMeet Support</strong>. We have successfully logged your inquiry and our support team has been notified.
        </div>
        <div class="badge-box">
          ⏱️ <strong>Response Guarantee:</strong> Our operations desk reviews all submissions and will reply to this address within <strong>24 hours</strong>.
        </div>
        <div class="summary-card">
          <div class="summary-title">Summary of Your Inquiry</div>
          <div class="summary-subject">Subject: ${subject}</div>
          <div class="summary-body">"${safeMessage}"</div>
        </div>
        <div class="message-text" style="font-size: 13px; color: #64748b;">
          If you have additional context or screenshots to provide, simply reply directly to this email or write to <a href="mailto:logiterax@gmail.com" style="color: #f472b6;">logiterax@gmail.com</a>.
        </div>
      </div>
      <div class="footer-section">
        <p style="margin: 0 0 10px 0;">VibeMeet Automated Support Dispatch &bull; <a href="mailto:logiterax@gmail.com" style="color: #f472b6;">logiterax@gmail.com</a></p>
        <p style="margin: 0; font-size: 11px; color: #475569;">&copy; ${currentYear} VibeMeet Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const sendAutoResponderEmail = async ({ email, name, subject, message }: SendAutoResponderOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn('Autoresponder warning: SMTP not configured, skipping actual email send.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const htmlContent = generateAutoResponderEmailHtml({ email, name, subject, message });
  const textContent = `Hello ${name},\n\nThank you for reaching out to VibeMeet Support! We have received your inquiry regarding "${subject}".\n\nOur team will review your message and respond within 24 hours.\n\nYour message:\n${message}\n\nBest regards,\nVibeMeet Support Team\nlogiterax@gmail.com`;

  await transporter.sendMail({
    from: `"VibeMeet Support" <${SMTP_FROM}>`,
    to: email,
    replyTo: 'logiterax@gmail.com',
    subject: `[Received] We got your message: ${subject}`,
    text: textContent,
    html: htmlContent,
    attachments: getLogoAttachment()
  });
};

export interface SendAdminCustomEmailOptions {
  to: string;
  subject: string;
  message: string;
  recipientName?: string;
  adminName?: string;
}

export const generateAdminCustomEmailHtml = ({ recipientName, subject, message, adminName }: { recipientName?: string; subject: string; message: string; adminName?: string }): string => {
  const currentYear = new Date().getFullYear();
  const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .email-container {
      max-width: 580px; margin: 30px auto;
      background-color: #0f172a; border: 1px solid #1e293b;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.15);
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%);
      padding: 32px 20px 24px; text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-logo-img {
      max-width: 210px; width: 100%; height: auto;
      border-radius: 20px; display: inline-block;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(236, 72, 153, 0.3);
    }
    .body-content { padding: 36px 32px; }
    .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
    .message-box {
      font-size: 15px; line-height: 1.7; color: #cbd5e1;
      margin-bottom: 28px; background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px; padding: 22px;
    }
    .signature {
      font-size: 14px; color: #94a3b8; line-height: 1.5;
    }
    .signature strong { color: #f472b6; }
    .footer-section {
      padding: 24px 32px; background-color: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center; font-size: 12px; color: #64748b;
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      <div class="header-banner">
        <img src="cid:vibemeetLogo" alt="VibeMeet - No Swipes. Just Connections." class="header-logo-img" />
      </div>
      <div class="body-content">
        <div class="greeting">Hello ${recipientName || 'there'}! 👋</div>
        <div class="message-box">
          ${safeMessage}
        </div>
        <div class="signature">
          Warm regards,<br/>
          <strong>${adminName || 'VibeMeet Operations Team'}</strong><br/>
          Direct reply channel: <a href="mailto:logiterax@gmail.com" style="color: #f472b6; text-decoration: none;">logiterax@gmail.com</a>
        </div>
      </div>
      <div class="footer-section">
        <p style="margin: 0 0 10px 0;">Official communication from VibeMeet Team &bull; <a href="mailto:logiterax@gmail.com" style="color: #f472b6;">logiterax@gmail.com</a></p>
        <p style="margin: 0; font-size: 11px; color: #475569;">&copy; ${currentYear} VibeMeet Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export interface SendAccountStatusEmailOptions {
  email: string;
  name?: string;
  status: 'BANNED' | 'ACTIVE';
}

export const generateAccountStatusEmailHtml = ({ name, status }: { name?: string; status: 'BANNED' | 'ACTIVE' }): string => {
  const currentYear = new Date().getFullYear();
  const greetingName = name || 'there';
  const isBanned = status === 'BANNED';

  const accentColor = isBanned ? '#ef4444' : '#10b981';
  const accentGlow = isBanned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
  const borderColor = isBanned ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)';
  const statusIcon = isBanned ? '🚫' : '✅';
  const statusTitle = isBanned ? 'Account Suspended' : 'Account Reinstated';
  const statusBadge = isBanned ? 'SUSPENDED' : 'ACTIVE';
  const bodyMessage = isBanned
    ? `Your <strong>VibeMeet</strong> account has been <strong>suspended</strong> by our moderation team following a review of activity on your account. During this period, access to VibeMeet services will be restricted.<br/><br/>If you believe this action was taken in error or would like to appeal, please reach out to our support team directly.`
    : `Great news! Your <strong>VibeMeet</strong> account has been <strong>reinstated</strong> and is now fully active. You can log back in and continue enjoying all VibeMeet features.<br/><br/>We appreciate your understanding and welcome you back to the community!`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle} - VibeMeet</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 580px; margin: 30px auto;
      background-color: #0f172a; border: 1px solid #1e293b;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${accentGlow};
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%);
      padding: 32px 20px 24px; text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-logo-img {
      max-width: 210px; width: 100%; height: auto;
      border-radius: 20px; display: inline-block;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 25px ${accentGlow};
    }
    .body-content { padding: 36px 32px; }
    .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
    .message-text { font-size: 15px; line-height: 1.7; color: #94a3b8; margin-bottom: 24px; }
    .status-card {
      background: linear-gradient(135deg, ${accentGlow}, transparent);
      border: 1px solid ${borderColor};
      border-radius: 18px; padding: 22px 24px;
      text-align: center; margin-bottom: 28px;
    }
    .status-icon { font-size: 40px; margin-bottom: 10px; }
    .status-badge {
      display: inline-block;
      background: ${accentColor};
      color: #ffffff;
      font-size: 11px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 2px;
      padding: 4px 16px; border-radius: 50px;
      margin-bottom: 10px;
    }
    .status-label { font-size: 17px; font-weight: 700; color: #ffffff; }
    .info-box {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px; padding: 16px 20px;
      font-size: 13px; color: #94a3b8; line-height: 1.5;
    }
    .info-box strong { color: #e2e8f0; }
    .footer-section {
      padding: 24px 32px; background-color: #0b1120;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center; font-size: 12px; color: #64748b;
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      <div class="header-banner">
        <img src="cid:vibemeetLogo" alt="VibeMeet - No Swipes. Just Connections." class="header-logo-img" />
      </div>
      <div class="body-content">
        <div class="greeting">Hello ${greetingName}! 👋</div>
        <div class="message-text">${bodyMessage}</div>
        <div class="status-card">
          <div class="status-icon">${statusIcon}</div>
          <div class="status-badge">${statusBadge}</div>
          <div class="status-label">Account Status: ${statusBadge}</div>
        </div>
        <div class="info-box">
          📬 <strong>Need to appeal or get help?</strong> Contact our support team anytime at <a href="mailto:logiterax@gmail.com" style="color: #f472b6; text-decoration: none;">logiterax@gmail.com</a>. We aim to respond within 24 hours.
        </div>
      </div>
      <div class="footer-section">
        <p style="margin: 0 0 10px 0;">VibeMeet Moderation Team &bull; <a href="mailto:logiterax@gmail.com" style="color: #f472b6;">logiterax@gmail.com</a></p>
        <p style="margin: 0; font-size: 11px; color: #475569;">&copy; ${currentYear} VibeMeet Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const sendAccountStatusEmail = async ({ email, name, status }: SendAccountStatusEmailOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn('Account status email skipped: SMTP not configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const isBanned = status === 'BANNED';
  const subject = isBanned
    ? 'Important: Your VibeMeet Account Has Been Suspended'
    : 'Your VibeMeet Account Has Been Reinstated';
  const textContent = isBanned
    ? `Hello ${name || 'there'},\n\nYour VibeMeet account has been suspended by our moderation team. If you believe this is an error, please contact logiterax@gmail.com.\n\n© ${new Date().getFullYear()} VibeMeet Inc.`
    : `Hello ${name || 'there'},\n\nGreat news! Your VibeMeet account has been reinstated and is now fully active. Welcome back!\n\nNeed help? Contact logiterax@gmail.com\n\n© ${new Date().getFullYear()} VibeMeet Inc.`;

  const htmlContent = generateAccountStatusEmailHtml({ name, status });

  await transporter.sendMail({
    from: `"VibeMeet Moderation" <${SMTP_FROM}>`,
    to: email,
    replyTo: 'logiterax@gmail.com',
    subject,
    text: textContent,
    html: htmlContent,
    attachments: getLogoAttachment()
  });
};

export const sendAdminCustomEmail = async ({ to, subject, message, recipientName, adminName }: SendAdminCustomEmailOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Email delivery is not configured. Add SMTP credentials to backend/.env.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const htmlContent = generateAdminCustomEmailHtml({ recipientName, subject, message, adminName });
  const textContent = `Hello ${recipientName || 'there'},\n\n${message}\n\nWarm regards,\n${adminName || 'VibeMeet Operations Team'}\nlogiterax@gmail.com`;

  await transporter.sendMail({
    from: `"VibeMeet Operations" <${SMTP_FROM}>`,
    to,
    replyTo: 'logiterax@gmail.com',
    subject,
    text: textContent,
    html: htmlContent,
    attachments: getLogoAttachment()
  });
};

export interface SendLoginLockoutOtpEmailOptions {
  email: string;
  otp: string;
  name?: string;
}

export const generateLoginLockoutOtpEmailHtml = (otp: string, name?: string): string => {
  const greetingName = name ? name.trim() : 'there';
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Verification Required</title>
  <style>
    body { margin: 0; padding: 0; background-color: #080c16; font-family: -apple-system, sans-serif; color: #e2e8f0; }
    .email-container { max-width: 580px; margin: 30px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; }
    .header-banner { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0b0f19 100%); padding: 32px 20px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    .body-content { padding: 36px 32px; }
    .otp-card { background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.08)); border: 1px solid rgba(236, 72, 153, 0.35); border-radius: 18px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .otp-code { font-family: monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; margin: 4px 0; }
    .footer-section { padding: 24px 32px; background-color: #0b1120; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div style="padding: 20px 10px;">
    <div class="email-container">
      <div class="header-banner">
        <h2 style="margin:0; color: #fff;">VibeMeet Security</h2>
      </div>
      <div class="body-content">
        <h3 style="margin-top: 0;">Hello ${greetingName},</h3>
        <p>Your account was temporarily locked due to multiple incorrect login attempts. We have generated a verification code for you to use upon your next successful login attempt after the lockout period expires.</p>
        <div class="otp-card">
          <div style="font-size: 11px; color: #f472b6; font-weight: 700; text-transform: uppercase;">Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">⏱️ Valid for 10 minutes</div>
        </div>
      </div>
      <div class="footer-section">
        <p>&copy; ${currentYear} VibeMeet Inc.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const sendLoginLockoutOtpEmail = async ({ email, otp, name }: SendLoginLockoutOtpEmailOptions): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Email delivery is not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const htmlContent = generateLoginLockoutOtpEmailHtml(otp, name);
  const textContent = `Hello ${name || 'there'},\n\nYour account was temporarily locked due to multiple incorrect login attempts. Your verification code is: ${otp}\nThis code expires in 10 minutes.`;

  await transporter.sendMail({
    from: `"VibeMeet Security" <${SMTP_FROM}>`,
    to: email,
    subject: `VibeMeet Login Verification Code: ${otp}`,
    text: textContent,
    html: htmlContent
  });
};

