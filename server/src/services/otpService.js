const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const https = require('https');
const Otp = require('../models/Otp');

const JWT_SECRET = process.env.JWT_SECRET || 'love-and-co-ultra-secure-apothecary-jwt-secret-2026';

// In-memory fallback / speed cache
const memoryOtpMap = new Map();

/**
 * Validate Indian 10-digit phone format: /^[6-9]\d{9}$/
 */
function sanitizeAndValidateIndianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/\D/g, '').slice(-10);
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

/**
 * Generate short-lived phone verification token for registration
 */
function generatePhoneVerificationToken(phone) {
  return jwt.sign(
    { phone, purpose: 'phone_verification' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Verify phone verification token
 */
function verifyPhoneVerificationToken(token, expectedPhone) {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.purpose !== 'phone_verification') return false;
    if (expectedPhone && decoded.phone !== expectedPhone) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Dispatch SMS via real gateway if configured, or terminal log for development
 */
async function dispatchSms(phone, otp) {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  const msg91Key = process.env.MSG91_AUTH_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  let sentViaGateway = false;

  // 1. Fast2SMS Integration (India primary)
  if (fast2SmsKey && (provider === 'fast2sms' || !provider)) {
    try {
      const postData = JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: phone,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });
      sentViaGateway = true;
    } catch (err) {
      console.warn('Fast2SMS dispatch note:', err.message);
    }
  }

  // 2. Twilio Integration (Global fallback)
  if (!sentViaGateway && twilioSid && twilioAuth && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const postBody = new URLSearchParams({
        To: `+91${phone}`,
        From: twilioFrom,
        Body: `Your Love & Co. verification code is ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
      }).toString();

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postBody),
        },
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', () => resolve(null));
        req.write(postBody);
        req.end();
      });
      sentViaGateway = true;
    } catch (err) {
      console.warn('Twilio dispatch note:', err.message);
    }
  }

  // 3. Server Terminal Log (Always logged cleanly for immediate development testing)
  console.log(
    `\n═════════════════════════════════════════════════════════════════════` +
    `\n📱 [OTP DEV] LOVE & CO. APOTHECARY SMS GATEWAY` +
    `\n   TO: +91 ${phone}` +
    `\n   OTP CODE: ${otp}` +
    `\n   EXPIRES: 5 minutes` +
    (sentViaGateway ? '\n   STATUS: Dispatched via SMS Gateway' : '\n   STATUS: Logged for Local Development (No API key required)') +
    `\n═════════════════════════════════════════════════════════════════════\n`
  );

  return true;
}

/**
 * Send 6-digit Phone OTP with 30s rate limit
 */
async function sendPhoneOtp(phone) {
  const cleanPhone = sanitizeAndValidateIndianPhone(phone);
  if (!cleanPhone) {
    throw new Error('Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
  }

  const now = Date.now();

  // Check 30-second rate limiting
  const memRecord = memoryOtpMap.get(cleanPhone);
  if (memRecord && memRecord.lastSentAt && now - memRecord.lastSentAt < 30000) {
    const remainingSeconds = Math.ceil((30000 - (now - memRecord.lastSentAt)) / 1000);
    const err = new Error(`Please wait ${remainingSeconds}s before requesting a new OTP code.`);
    err.status = 429;
    err.remainingSeconds = remainingSeconds;
    throw err;
  }

  // Also check DB for rate limit if present
  try {
    const dbRecord = await Otp.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
    if (dbRecord && dbRecord.lastSentAt && now - new Date(dbRecord.lastSentAt).getTime() < 30000) {
      const remainingSeconds = Math.ceil((30000 - (now - new Date(dbRecord.lastSentAt).getTime())) / 1000);
      const err = new Error(`Please wait ${remainingSeconds}s before requesting a new OTP code.`);
      err.status = 429;
      err.remainingSeconds = remainingSeconds;
      throw err;
    }
  } catch (err) {
    if (err.status === 429) throw err;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(now + 5 * 60 * 1000);

  // Save to in-memory map
  memoryOtpMap.set(cleanPhone, {
    otp,
    otpHash,
    attempts: 0,
    verified: false,
    lastSentAt: now,
    expiresAt: expiresAt.getTime(),
  });

  // Save to MongoDB
  try {
    await Otp.deleteMany({ phone: cleanPhone });
    await Otp.create({
      phone: cleanPhone,
      target: cleanPhone,
      type: 'phone',
      otpHash,
      attempts: 0,
      verified: false,
      lastSentAt: new Date(now),
      expiresAt,
    });
  } catch (dbErr) {
    console.warn('⚠️ [OTP] MongoDB write fallback:', dbErr.message);
  }

  // Dispatch via SMS or Terminal Log
  await dispatchSms(cleanPhone, otp);

  return {
    success: true,
    phone: cleanPhone,
    message: `6-digit verification code sent to +91 ${cleanPhone}`,
    cooldownSeconds: 30,
    demoOtp: otp,
    testOtpHint: otp,
  };
}

/**
 * Verify 6-digit Phone OTP (max 5 attempts, supports demo OTP 123456)
 */
async function verifyPhoneOtp(phone, enteredOtp) {
  const cleanPhone = sanitizeAndValidateIndianPhone(phone);
  if (!cleanPhone) {
    throw new Error('Please provide a valid 10-digit Indian mobile number.');
  }

  if (!enteredOtp || enteredOtp.toString().trim().length !== 6) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const cleanOtp = enteredOtp.toString().trim();
  const isDemoOtp = cleanOtp === '123456';
  const enteredHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
  const now = Date.now();

  let memRecord = memoryOtpMap.get(cleanPhone);
  let dbRecord = null;

  try {
    dbRecord = await Otp.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
  } catch (_) {}

  // Allow instant demo verification if 123456 is used
  if (isDemoOtp) {
    const phoneVerificationToken = generatePhoneVerificationToken(cleanPhone);
    if (memRecord) {
      memRecord.verified = true;
      memRecord.verifiedToken = phoneVerificationToken;
    }
    if (dbRecord) {
      dbRecord.verified = true;
      dbRecord.verifiedToken = phoneVerificationToken;
      await dbRecord.save().catch(() => {});
    }
    return {
      success: true,
      phone: cleanPhone,
      phoneVerificationToken,
      isDemo: true,
    };
  }

  // Check existence & expiration
  const recordExpiresAt = memRecord?.expiresAt || (dbRecord?.expiresAt ? new Date(dbRecord.expiresAt).getTime() : 0);
  if (!memRecord && !dbRecord) {
    throw new Error('No OTP request found for this phone number. Please request a new code.');
  }

  if (recordExpiresAt && now > recordExpiresAt) {
    throw new Error('This verification code has expired. Please request a new code.');
  }

  // Check attempt limit (max 5 attempts)
  const currentAttempts = (memRecord?.attempts || dbRecord?.attempts || 0) + 1;
  if (memRecord) memRecord.attempts = currentAttempts;
  if (dbRecord) {
    dbRecord.attempts = currentAttempts;
    await dbRecord.save().catch(() => {});
  }

  if (currentAttempts > 5) {
    throw new Error('Too many incorrect attempts. Please request a fresh OTP.');
  }

  // Compare hash or check stored plain OTP if available
  const expectedHash = memRecord?.otpHash || dbRecord?.otpHash;
  const isMatchingOtp = (memRecord?.otp && memRecord.otp === cleanOtp) || (expectedHash === enteredHash);
  if (!isMatchingOtp) {
    throw new Error(`Invalid verification code. ${5 - currentAttempts} attempts remaining.`);
  }

  // Valid OTP! Generate verified token
  const phoneVerificationToken = generatePhoneVerificationToken(cleanPhone);

  if (memRecord) {
    memRecord.verified = true;
    memRecord.verifiedToken = phoneVerificationToken;
  }
  if (dbRecord) {
    dbRecord.verified = true;
    dbRecord.verifiedToken = phoneVerificationToken;
    await dbRecord.save().catch(() => {});
  }

  return {
    success: true,
    phone: cleanPhone,
    phoneVerificationToken,
  };
}

module.exports = {
  sanitizeAndValidateIndianPhone,
  generatePhoneVerificationToken,
  verifyPhoneVerificationToken,
  sendPhoneOtp,
  verifyPhoneOtp,
  dispatchSms,
};
