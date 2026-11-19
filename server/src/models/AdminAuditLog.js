const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminEmail: {
      type: String,
      required: true,
      default: 'loveandcoadmin@gmail.com',
    },
    adminRole: {
      type: String,
      default: 'admin',
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'INVENTORY_UPDATE',
        'PRICE_CHANGE',
        'ORDER_STATUS_UPDATE',
        'AWB_ASSIGNED',
        'BATCH_QC_UPDATE',
        'BATCH_HOLD',
        'FORMULATION_CREATED',
        'STORE_STATUS_TOGGLE',
        'PROMOTION_CREATED',
        'CUSTOMER_TICKET_RESOLVED',
      ],
      index: true,
    },
    targetEntity: {
      type: String,
      required: true, // e.g. 'Product', 'Order', 'CuringBatch', 'Store'
    },
    targetId: {
      type: String,
      default: '',
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: 'Routine administrative operation',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);

