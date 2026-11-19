require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const seedProducts = require('../data/seedProducts');

async function seed() {
  console.log('🌱 Starting Love & Co. Product Catalog Seeding...');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/love_and_co';
  
  let mongod = null;
  try {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log('✅ Connected to MongoDB at:', uri);
    } catch (conErr) {
      console.warn('⚠️ External MongoDB not found, falling back to embedded MongoMemoryServer for standalone execution...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('✅ Connected to MongoMemoryServer at:', mongod.getUri());
    }

    // 1. Purge all prior products to fulfill clean catalog state
    const deleteResult = await Product.deleteMany({});
    console.log(`🧹 Removed ${deleteResult.deletedCount} existing legacy products from collection.`);

    // 2. Upsert/Insert the 4 authentic Love & Co. products
    const seeded = [];
    for (const p of seedProducts) {
      const doc = await Product.findOneAndUpdate(
        { slug: p.slug },
        { $set: p },
        { upsert: true, new: true, runValidators: true }
      );
      seeded.push(doc);
      console.log(` ✨ Seeded: "${doc.name}" [slug: ${doc.slug}] - ₹${doc.price} (${doc.category})`);
    }

    console.log(`\n🎉 Successfully initialized ${seeded.length} authentic Love & Co. formulations:`);
    seeded.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name} (${item.volumeWeight}) - ₹${item.price} [Variants: ${item.variants?.length || 0}]`);
    });

  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    console.log('🔒 Database connection closed.');
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
