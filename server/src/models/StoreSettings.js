const mongoose = require('mongoose');

const StoreSettingsSchema = new mongoose.Schema(
  {
    shiprocket: {
      apiEmail: { type: String, default: '' },
      apiPassword: { type: String, default: '' },
      pickupPincode: { type: String, default: '560038' },
      defaultWeightKg: { type: Number, default: 0.5 },
      isLive: { type: Boolean, default: false },
    },
    razorpay: {
      keyId: { type: String, default: '' },
      keySecret: { type: String, default: '' },
      isLiveMode: { type: Boolean, default: false },
      webhookSecret: { type: String, default: '' },
    },
    notification: {
      smsApiKey: { type: String, default: '' },
      whatsappApiKey: { type: String, default: '' },
      defaultSenderId: { type: String, default: 'LOVNCO' },
      otpEnabled: { type: Boolean, default: true },
    },
    storeProfile: {
      brandName: { type: String, default: 'LOVE & Co. Botanical Formulations' },
      supportEmail: { type: String, default: 'loveandcosupport@gmail.com' },
      contactPhone: { type: String, default: '+91 94406 07778' },
      gstin: { type: String, default: '29ABCDE1234F1Z5' },
      address: { type: String, default: 'No. 42, Apothecary Garden Estate, Indiranagar, Bengaluru 560038, India' },
      currency: { type: String, default: 'INR' },
    },
    storeStatus: {
      isPaused: { type: Boolean, default: false },
      pauseReason: { type: String, default: '' },
      reopenDate: { type: String, default: '' },
      pauseNotice: { type: String, default: 'Our cold-process botanical cure room is currently completing lipid saponification. Orders are temporarily paused and will resume shortly.' },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', StoreSettingsSchema);

