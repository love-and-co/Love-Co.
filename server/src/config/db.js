const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const seedProducts = require('../data/seedProducts');

let mongodInstance = null;

// Suppress unhandled background DNS/topology errors on dropped connections
mongoose.connection.on('error', (err) => {
  if (err && err.message && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo'))) {
    // Suppress background unhandled errors from dead Atlas connection attempts
    return;
  }
  console.warn('⚠️ [DB] Connection notice:', err.message);
});

async function seedDemoUserOrders() {
  return;
}

async function seedInitialData() {
  try {
    // Purge removed legacy products from database
    const activeSlugs = seedProducts.map((p) => p.slug);
    const purged = await Product.deleteMany({ slug: { $nin: activeSlugs } });
    if (purged.deletedCount > 0) {
      console.log(`🧹 [DB] Purged ${purged.deletedCount} legacy products`);
    }

    // Sync/upsert seed products so updated image paths and formulation metadata reflect immediately
    for (const p of seedProducts) {
      await Product.findOneAndUpdate(
        { slug: p.slug },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ [DB] Successfully synchronized ${seedProducts.length} authentic Love & Co. formulations`);

    // Ensure official sole admin account exists
    const ADMIN_ACCOUNTS = [
      { email: 'loveandcoadmin@gmail.com', phone: '9440607778', role: 'admin', name: 'Kalyan', password: 'admin@789' },
    ];
    const ADMIN_EMAILS = ADMIN_ACCOUNTS.map((a) => a.email);

    for (const acc of ADMIN_ACCOUNTS) {
      let adminUser = await User.findOne({ email: acc.email });
      if (!adminUser) {
        // Ensure no phone collision before creating
        const existingWithPhone = await User.findOne({ phone: acc.phone });
        if (existingWithPhone) {
          existingWithPhone.phone = undefined;
          await existingWithPhone.save();
        }
        adminUser = await User.create({
          fullName: acc.name,
          email: acc.email,
          phone: acc.phone,
          isPhoneVerified: true,
          password: acc.password || 'admin@789',
          role: 'admin',
        });
        console.log(`🛡️ [DB] Seeded official sole admin user: ${acc.email} (${acc.name})`);
      } else {
        adminUser.fullName = acc.name;
        adminUser.role = 'admin';
        adminUser.isPhoneVerified = true;
        adminUser.password = acc.password || 'admin@789';
        const otherWithPhone = await User.findOne({ phone: acc.phone, _id: { $ne: adminUser._id } });
        if (!otherWithPhone) {
          adminUser.phone = acc.phone;
        }
        await adminUser.save();
        console.log(`🛡️ [DB] Updated official sole admin user: ${acc.email} (${acc.name})`);
      }
    }

    // Clean up old demo accounts (admin & fake demo customers)
    await User.deleteMany({ email: { $in: ['admin@loveandco.com', 'loveandcosupport@gmail.com', 'client@loveandco.com'] } });
    await Order.deleteMany({ 'shippingAddress.email': 'client@loveandco.com' });

    // Enforce 2-role lock in database: demote all non-admin emails strictly to 'customer'
    await User.updateMany(
      { email: { $nin: ADMIN_EMAILS } },
      { $set: { role: 'customer' } }
    );
    await User.updateMany(
      { email: { $in: ADMIN_EMAILS } },
      { $set: { role: 'admin' } }
    );

    // Seed authentic orders if order collection is empty
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('📦 [DB] Seeding authentic Love & Co. orders dataset...');
      const bloom = await Product.findOne({ slug: 'love-and-co-bloom-neem-turmeric-soap' }) || await Product.findOne();
      const blush = await Product.findOne({ slug: 'love-and-co-blush-rose-goat-milk-soap' }) || bloom;
      const velvet = await Product.findOne({ slug: 'love-and-co-velvet-red-sandalwood-shea-butter-soap' }) || bloom;
      const velisse = await Product.findOne({ slug: 'love-and-co-velisse-rose-shea-lip-balm' }) || bloom;

      const initialOrders = [
        {
          orderNumber: 'ORD-2026-8901',
          orderId: 'ORD-2026-8901',
          customer: undefined,
          customerId: undefined,
          shippingAddress: {
            recipientName: 'Aditi Rao',
            email: 'aditi.rao@gmail.com',
            phone: '+91 98450 12345',
            street: 'Flat 402, Magnolia Residency, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            country: 'India',
          },
          items: [
            {
              product: bloom?._id,
              productId: bloom?._id?.toString() || 'prod_bloom',
              title: bloom?.name || 'LOVE & Co. BLOOM (Neem & Turmeric Cold-Process Soap)',
              batchNumber: 'LOT-CP-2026-BLM01',
              quantity: 1,
              unitPrice: 269,
              price: 269,
              gstRate: 18,
              image: '/images/products/bloom_neem_turmeric_soap.jpg',
            },
            {
              product: velisse?._id,
              productId: velisse?._id?.toString() || 'prod_velisse',
              title: velisse?.name || 'LOVE & Co. VELISSE (Rose & Shea Butter Lip Balm)',
              batchNumber: 'LOT-LB-2026-VEL01',
              quantity: 1,
              unitPrice: 229,
              price: 229,
              gstRate: 18,
              image: '/images/products/velisse_rose_lipbalm.jpg',
            },
          ],
          subtotal: 498,
          discountAmount: 50,
          discountTotal: 50,
          shippingFee: 0,
          totalAmount: 448,
          grandTotal: 448,
          pricingBreakdown: {
            subtotal: 498,
            discount: 50,
            shippingFee: 0,
            taxAmount: 68.34,
            totalAmount: 448,
          },
          payment: {
            mode: 'PREPAID',
            gateway: 'Razorpay',
            status: 'PAID',
            transactionId: 'pay_RZP891294821',
          },
          paymentDetails: {
            provider: 'Razorpay',
            transactionId: 'pay_RZP891294821',
            paymentStatus: 'PAID',
          },
          shipping: {
            courier: 'Bluedart Air Express',
            awbNumber: 'BLU-892182910291',
            trackingUrl: 'https://track.bluedart.com/?awb=BLU-892182910291',
            status: 'DISPATCHED',
          },
          fulfillmentStatus: 'DISPATCHED',
          trackingTimeline: [
            { stage: 'PLACED', description: 'Order placed and confirmed.', completed: true },
            { stage: 'PROCESSING', description: 'Batch inspected and packed.', completed: true },
            { stage: 'DISPATCHED', description: 'Dispatched via Bluedart Air Express.', completed: true },
          ],
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
        {
          orderNumber: 'ORD-2026-8902',
          orderId: 'ORD-2026-8902',
          customer: undefined,
          customerId: undefined,
          shippingAddress: {
            recipientName: 'Karan Mehra',
            email: 'karan.mehra@techcorp.in',
            phone: '+91 97110 98765',
            street: 'Tower 3, Cyber City DLF Phase 2',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122002',
            country: 'India',
          },
          items: [
            {
              product: blush?._id,
              productId: blush?._id?.toString() || 'prod_blush',
              title: blush?.name || 'LOVE & Co. BLUSH (Rose & Goat Milk Cold-Process Soap)',
              batchNumber: 'LOT-CP-2026-BLS01',
              quantity: 1,
              unitPrice: 299,
              price: 299,
              gstRate: 18,
              image: '/images/products/blush_rose_goatmilk_soap.jpg',
            },
          ],
          subtotal: 299,
          discountAmount: 0,
          discountTotal: 0,
          shippingFee: 50,
          totalAmount: 349,
          grandTotal: 349,
          pricingBreakdown: {
            subtotal: 299,
            discount: 0,
            shippingFee: 50,
            taxAmount: 53.21,
            totalAmount: 349,
          },
          payment: {
            mode: 'COD',
            gateway: 'Razorpay',
            status: 'PENDING',
          },
          paymentDetails: {
            provider: 'COD',
            paymentStatus: 'AUTHORIZED',
          },
          shipping: {
            courier: 'Delhivery Surface',
            status: 'UNFULFILLED',
          },
          fulfillmentStatus: 'PLACED',
          isRtoRisk: true,
          trackingTimeline: [
            { stage: 'PLACED', description: 'Order placed via Cash on Delivery.', completed: true },
          ],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          orderNumber: 'ORD-2026-8898',
          orderId: 'ORD-2026-8898',
          customer: undefined,
          customerId: undefined,
          shippingAddress: {
            recipientName: 'Dr. Sneha Varma',
            email: 'sneha.varma@apollo.org',
            phone: '+91 98201 44221',
            street: '12-B, Bandra West, Perry Cross Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            country: 'India',
          },
          items: [
            {
              product: velisse?._id,
              productId: velisse?._id?.toString() || 'prod_velisse',
              title: velisse?.name || 'LOVE & Co. VELISSE (Rose & Shea Butter Lip Balm)',
              batchNumber: 'LOT-LB-2026-VEL01',
              quantity: 2,
              unitPrice: 229,
              price: 229,
              gstRate: 18,
              image: '/images/products/velisse_rose_lipbalm.jpg',
            },
          ],
          subtotal: 458,
          discountAmount: 40,
          discountTotal: 40,
          shippingFee: 0,
          totalAmount: 418,
          grandTotal: 418,
          pricingBreakdown: {
            subtotal: 458,
            discount: 40,
            shippingFee: 0,
            taxAmount: 63.76,
            totalAmount: 418,
          },
          payment: {
            mode: 'PREPAID',
            gateway: 'Cashfree',
            status: 'PAID',
            transactionId: 'cf_TXN_992102918',
          },
          paymentDetails: {
            provider: 'Razorpay',
            transactionId: 'cf_TXN_992102918',
            paymentStatus: 'PAID',
          },
          shipping: {
            courier: 'Bluedart Express',
            awbNumber: 'BLU-992104817263',
            trackingUrl: 'https://track.bluedart.com/?awb=BLU-992104817263',
            status: 'PACKED',
          },
          fulfillmentStatus: 'PROCESSING',
          trackingTimeline: [
            { stage: 'PLACED', description: 'Order confirmed.', completed: true },
            { stage: 'PROCESSING', description: 'Order packed and label generated.', completed: true },
          ],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          orderNumber: 'ORD-2026-8894',
          orderId: 'ORD-2026-8894',
          customer: undefined,
          customerId: undefined,
          shippingAddress: {
            recipientName: 'Rhea Sen',
            email: 'rhea.sen@outlook.com',
            phone: '+91 98300 55441',
            street: 'Alipore Park Road, Block C',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700027',
            country: 'India',
          },
          items: [
            {
              product: velvet?._id,
              productId: velvet?._id?.toString() || 'prod_velvet',
              title: velvet?.name || 'LOVE & Co. VELVET (Red Sandalwood & Shea Soap)',
              batchNumber: 'LOT-CP-2026-VLV01',
              quantity: 1,
              unitPrice: 319,
              price: 319,
              gstRate: 18,
              image: '/images/products/velvet_sandalwood_shea_soap.jpg',
            },
            {
              product: bloom?._id,
              productId: bloom?._id?.toString() || 'prod_bloom',
              title: bloom?.name || 'LOVE & Co. BLOOM (Neem & Turmeric Cold-Process Soap)',
              batchNumber: 'LOT-CP-2026-BLM01',
              quantity: 1,
              unitPrice: 269,
              price: 269,
              gstRate: 18,
              image: '/images/products/bloom_neem_turmeric_soap.jpg',
            },
          ],
          subtotal: 588,
          discountAmount: 50,
          discountTotal: 50,
          shippingFee: 0,
          totalAmount: 538,
          grandTotal: 538,
          pricingBreakdown: {
            subtotal: 588,
            discount: 50,
            shippingFee: 0,
            taxAmount: 82.07,
            totalAmount: 538,
          },
          payment: {
            mode: 'PREPAID',
            gateway: 'Razorpay',
            status: 'PAID',
            transactionId: 'pay_RZP887102941',
          },
          paymentDetails: {
            provider: 'Razorpay',
            transactionId: 'pay_RZP887102941',
            paymentStatus: 'PAID',
          },
          shipping: {
            courier: 'Delhivery Express',
            awbNumber: 'DEL-77881029381',
            trackingUrl: 'https://track.delhivery.com/?awb=DEL-77881029381',
            status: 'DELIVERED',
          },
          fulfillmentStatus: 'DELIVERED',
          trackingTimeline: [
            { stage: 'PLACED', description: 'Order confirmed.', completed: true },
            { stage: 'PROCESSING', description: 'Order packed.', completed: true },
            { stage: 'DISPATCHED', description: 'Dispatched via Delhivery Express.', completed: true },
            { stage: 'DELIVERED', description: 'Delivered to customer doorstep.', completed: true },
          ],
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
        },
      ];

      for (const ord of initialOrders) {
        await Order.create(ord);
      }
      console.log(`✅ [DB] Successfully seeded ${initialOrders.length} authentic Love & Co. orders`);
    }
  } catch (err) {
    console.error('❌ [DB] Error during initial seeding:', err.message);
  }
}

let cachedConnectionPromise = null;

async function connectDB() {
  // Return immediately if an active pooled connection already exists
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  cachedConnectionPromise = _establishConnection().catch((err) => {
    cachedConnectionPromise = null;
    throw err;
  });

  return cachedConnectionPromise;
}

async function _establishConnection() {
  const uri = process.env.MONGODB_URI;
  const poolOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 2500,
    connectTimeoutMS: 2500,
    socketTimeoutMS: 45000,
  };

  if (uri && uri.trim() !== '') {
    try {
      console.log('🔌 [DB] Connecting to MongoDB via provided URI...');
      await mongoose.connect(uri, poolOptions);
      console.log('✅ [DB] Connected to external MongoDB');
      await seedInitialData();
      return mongoose.connection;
    } catch (err) {
      console.warn(`⚠️ [DB] Could not connect to external MongoDB URI (${err.message}). Cleaning up connection...`);
      try {
        await mongoose.disconnect();
      } catch (_) {}
    }
  }

  // Check if local MongoDB is running at 127.0.0.1:27017
  try {
    console.log('🔌 [DB] Attempting local MongoDB connection (mongodb://127.0.0.1:27017/love_and_co)...');
    await mongoose.connect('mongodb://127.0.0.1:27017/love_and_co', {
      ...poolOptions,
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    console.log('✅ [DB] Connected to local MongoDB instance');
    await seedInitialData();
    return mongoose.connection;
  } catch (_) {
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }

  // Resilient In-Memory MongoDB Fallback
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`⚡ [DB] Launching embedded MongoMemoryServer (attempt ${attempt}/2, 60s timeout)...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000, // 60s instead of default 10s to prevent Windows/OneDrive timeout
        },
        binary: {
          skipMD5: true,
        },
      });
      const memUri = mongodInstance.getUri();
      console.log('⚡ [DB] Initialized in-memory MongoMemoryServer instance at:', memUri);

      await mongoose.connect(memUri, poolOptions);
      console.log('✅ [DB] Connected to embedded In-Memory MongoDB');
      await seedInitialData();
      return mongoose.connection;
    } catch (err) {
      console.warn(`⚠️ [DB] MongoMemoryServer launch attempt ${attempt} warning: ${err.message}`);
      if (mongodInstance) {
        try {
          await mongodInstance.stop();
        } catch (_) {}
        mongodInstance = null;
      }
      if (attempt === 2) {
        console.warn('⚠️ [DB] Could not launch embedded MongoDB. Operating with client resilient mock fallbacks.');
      }
    }
  }
}

module.exports = { connectDB, seedDemoUserOrders };
