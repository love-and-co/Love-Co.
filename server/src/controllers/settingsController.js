const StoreSettings = require('../models/StoreSettings');

// Helper to get or create settings singleton
async function getOrCreateSettingsDoc() {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({
      shiprocket: {
        apiEmail: process.env.SHIPROCKET_EMAIL || '',
        apiPassword: process.env.SHIPROCKET_PASSWORD || '',
        pickupPincode: '560038',
        defaultWeightKg: 0.5,
        isLive: Boolean(process.env.SHIPROCKET_EMAIL),
      },
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        isLiveMode: Boolean(process.env.RAZORPAY_KEY_SECRET),
        webhookSecret: '',
      },
      notification: {
        smsApiKey: '',
        whatsappApiKey: '',
        defaultSenderId: 'LOVNCO',
        otpEnabled: true,
      },
      storeProfile: {
        brandName: 'LOVE & Co. Botanical Formulations',
        supportEmail: 'loveandcosupport@gmail.com',
        contactPhone: '+91 94406 07778',
        gstin: '29ABCDE1234F1Z5',
        address: 'No. 42, Apothecary Garden Estate, Indiranagar, Bengaluru 560038, India',
        currency: 'INR',
      },
    });
  }
  return settings;
}

// Internal helper for services (returns raw secrets)
exports.getRawSettingsInternal = async () => {
  return await getOrCreateSettingsDoc();
};

// GET /api/admin/settings
exports.getStoreSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettingsDoc();
    const data = settings.toObject ? settings.toObject() : { ...settings };

    // Mask sensitive keys for client response
    const mask = (str) => {
      if (!str) return '';
      if (str.length <= 6) return '••••••';
      return `${str.slice(0, 4)}••••••••${str.slice(-2)}`;
    };

    const clientSafeSettings = {
      ...data,
      shiprocket: {
        ...data.shiprocket,
        hasPassword: Boolean(data.shiprocket?.apiPassword),
        apiPassword: data.shiprocket?.apiPassword ? '••••••••' : '',
      },
      razorpay: {
        ...data.razorpay,
        hasKeySecret: Boolean(data.razorpay?.keySecret),
        keySecret: data.razorpay?.keySecret ? mask(data.razorpay.keySecret) : '',
      },
      notification: {
        ...data.notification,
        hasSmsKey: Boolean(data.notification?.smsApiKey),
        smsApiKey: data.notification?.smsApiKey ? '••••••••' : '',
        hasWhatsappKey: Boolean(data.notification?.whatsappApiKey),
        whatsappApiKey: data.notification?.whatsappApiKey ? '••••••••' : '',
      },
    };

    res.json({ success: true, settings: clientSafeSettings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve store settings' });
  }
};

// PUT /api/admin/settings
exports.updateStoreSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettingsDoc();
    const { shiprocket, razorpay, notification, storeProfile } = req.body;

    if (shiprocket) {
      if (shiprocket.apiEmail !== undefined) settings.shiprocket.apiEmail = shiprocket.apiEmail;
      if (shiprocket.apiPassword && !shiprocket.apiPassword.includes('••••')) {
        settings.shiprocket.apiPassword = shiprocket.apiPassword;
      }
      if (shiprocket.pickupPincode !== undefined) settings.shiprocket.pickupPincode = shiprocket.pickupPincode;
      if (shiprocket.defaultWeightKg !== undefined) settings.shiprocket.defaultWeightKg = Number(shiprocket.defaultWeightKg);
      if (shiprocket.isLive !== undefined) settings.shiprocket.isLive = Boolean(shiprocket.isLive);
    }

    if (razorpay) {
      if (razorpay.keyId !== undefined) settings.razorpay.keyId = razorpay.keyId;
      if (razorpay.keySecret && !razorpay.keySecret.includes('••••')) {
        settings.razorpay.keySecret = razorpay.keySecret;
      }
      if (razorpay.isLiveMode !== undefined) settings.razorpay.isLiveMode = Boolean(razorpay.isLiveMode);
      if (razorpay.webhookSecret !== undefined) settings.razorpay.webhookSecret = razorpay.webhookSecret;
    }

    if (notification) {
      if (notification.smsApiKey && !notification.smsApiKey.includes('••••')) {
        settings.notification.smsApiKey = notification.smsApiKey;
      }
      if (notification.whatsappApiKey && !notification.whatsappApiKey.includes('••••')) {
        settings.notification.whatsappApiKey = notification.whatsappApiKey;
      }
      if (notification.defaultSenderId !== undefined) settings.notification.defaultSenderId = notification.defaultSenderId;
      if (notification.otpEnabled !== undefined) settings.notification.otpEnabled = Boolean(notification.otpEnabled);
    }

    if (storeProfile) {
      if (storeProfile.brandName !== undefined) settings.storeProfile.brandName = storeProfile.brandName;
      if (storeProfile.supportEmail !== undefined) settings.storeProfile.supportEmail = storeProfile.supportEmail;
      if (storeProfile.contactPhone !== undefined) settings.storeProfile.contactPhone = storeProfile.contactPhone;
      if (storeProfile.gstin !== undefined) settings.storeProfile.gstin = storeProfile.gstin;
      if (storeProfile.address !== undefined) settings.storeProfile.address = storeProfile.address;
      if (storeProfile.currency !== undefined) settings.storeProfile.currency = storeProfile.currency;
    }

    await settings.save();
    res.json({ success: true, message: 'Store settings updated successfully in database' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
};

