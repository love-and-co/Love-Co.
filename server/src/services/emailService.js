const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } catch (err) {
      console.warn('⚠️ [EmailService] Could not initialize SMTP transporter:', err.message);
    }
  }

  return transporter;
}

/**
 * Send 6-digit OTP email with Love & Co. luxury apothecary styling
 */
async function sendEmailOtp(toEmail, otp) {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Love & Co. Atelier" <loveandcosupport@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Your Love &amp; Co. Verification Code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #1C1614; margin: 0; padding: 32px 16px; }
          .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 16px rgba(28,22,20,0.04); }
          .header { text-align: center; border-bottom: 1px solid #FAF4EB; padding-bottom: 24px; margin-bottom: 28px; }
          .brand-title { font-size: 20px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #1C1614; margin: 0; }
          .brand-subtitle { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8C827A; margin-top: 6px; }
          .otp-box { background-color: #FAF8F5; border: 2px dashed #C5A880; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1C1614; }
          .expiry { font-size: 11px; color: #8C827A; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
          .footer { font-size: 11px; color: #A69E96; text-align: center; margin-top: 36px; border-top: 1px solid #FAF4EB; padding-top: 20px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">LOVE &amp; CO.</h1>
            <div class="brand-subtitle">BOTANICAL ATELIER &amp; APOTHECARY</div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #3A322D; margin-top: 0;">
            Greetings,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #3A322D;">
            Please use the 6-digit verification code below to confirm your email address for your Love &amp; Co. botanical account:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 5 minutes</div>
          </div>
          <p style="font-size: 12px; line-height: 1.6; color: #6E645D;">
            If you did not request this verification code, please disregard this transmission. Never share this code with anyone.
          </p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Love &amp; Co. Botanicals Private Limited.<br />
            Handcrafted Cold-Saponified Cleansers &amp; Barrier Lipid Formulations.
          </div>
        </div>
      </body>
    </html>
  `;

  if (t) {
    try {
      await t.sendMail({
        from,
        to: toEmail,
        subject: `${otp} is your Love & Co. Verification Code`,
        text: `Your Love & Co. verification code is: ${otp}. It expires in 5 minutes.`,
        html,
      });
      console.log(`✉️ [EmailService] OTP email dispatched to ${toEmail}`);
      return { success: true, sent: true };
    } catch (err) {
      console.error(`❌ [EmailService] Failed to send email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    // In dev / non-configured SMTP, log clearly
    console.log(`\n======================================================\n📨 [LOVE & CO. EMAIL SIMULATION]\nTO: ${toEmail}\nOTP CODE: ${otp}\nEXPIRES IN: 5 minutes\n======================================================\n`);
    return { success: true, simulated: true };
  }
}

module.exports = {
  sendEmailOtp,
};
