const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const { category, concern, skinType, vegan, fragranceFree, search, sort, page = 1, limit = 20 } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (concern && concern !== 'All Concerns') {
      let cleanConcern = concern;
      if (/barrier/i.test(concern)) cleanConcern = 'barrier';
      if (/acne/i.test(concern)) cleanConcern = 'acne';
      if (/pigment/i.test(concern)) cleanConcern = 'pigment';
      if (/dry/i.test(concern)) cleanConcern = 'dry';
      query.concernsHandled = { $regex: cleanConcern, $options: 'i' };
    }

    if (skinType && skinType !== 'All') {
      query.skinTypes = { $in: ['All', new RegExp(skinType, 'i')] };
    }

    if (vegan === 'true') {
      query.isVegan = true;
    }

    if (fragranceFree === 'true') {
      query.isFragranceFree = true;
    }

    if (search) {
      const cleanSearch = search.trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');

      // Singular/plural root term (e.g. "soaps" -> "soap", "balms" -> "balm", "bars" -> "bar")
      const rootTerm = cleanSearch.replace(/s$/i, '');
      const rootRegex = new RegExp(rootTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const isSoapQuery = /\b(soap|soaps|cleanser|cleansers|cleansing|bar|bars)\b/i.test(cleanSearch) || /cold[- ]?pressed/i.test(cleanSearch);
      const isLipQuery = /\b(balm|balms|lip|lips|butter|butters)\b/i.test(cleanSearch);

      const orConditions = [
        { name: searchRegex },
        { title: searchRegex },
        { slug: searchRegex },
        { category: searchRegex },
        { category: rootRegex },
        { activesConcentration: searchRegex },
        { tagline: searchRegex },
        { concernsHandled: searchRegex },
        { 'keyActives.name': searchRegex },
        { 'keyIngredientsDetail.name': searchRegex },
        { 'productDetails.productType': searchRegex },
        { 'productDetails.scentProfile': searchRegex },
        { fullIngredientsList: searchRegex },
      ];

      if (isSoapQuery) {
        orConditions.push({ category: 'cold-pressed-soaps' });
        orConditions.push({ 'productDetails.productType': { $regex: 'soap', $options: 'i' } });
        orConditions.push({ slug: { $regex: 'soap', $options: 'i' } });
      }

      if (isLipQuery) {
        orConditions.push({ category: 'lip-care' });
        orConditions.push({ 'productDetails.productType': { $regex: 'lip', $options: 'i' } });
        orConditions.push({ slug: { $regex: 'balm', $options: 'i' } });
      }

      query.$or = orConditions;
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'bestselling') sortOptions = { isBestSeller: -1, 'ratings.average': -1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [totalCount, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select('-reviews -inciIngredients -fullIngredientsList -productDetails')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
    ]);

    res.json({
      products,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const identifier = req.params.slug || req.params.handle;
    const mongoose = require('mongoose');
    const isOid = mongoose.Types.ObjectId.isValid(identifier);

    const product = await Product.findOne({
      $or: [
        { slug: identifier },
        { handle: identifier },
        ...(isOid ? [{ _id: identifier }] : []),
      ],
    }).lean();

    if (!product) {
      return res.status(404).json({ error: 'Botanical formulation not found' });
    }

    // Related formulations targeting same primary concern
    const related = await Product.find({
      _id: { $ne: product._id },
      category: { $ne: product.category },
      concernsHandled: { $in: product.concernsHandled },
    })
      .select('name title slug handle price compareAtPrice images category activesConcentration ratings volumeWeight stock stockQty status isBestSeller isNewLaunch')
      .limit(3)
      .lean();

    res.json({ product, related });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ isBestSeller: true }, { 'ratings.average': { $gte: 4.8 } }],
    })
      .select('name title slug handle price compareAtPrice images category activesConcentration ratings volumeWeight stock stockQty status isBestSeller isNewLaunch')
      .limit(8)
      .lean();

    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConcernsList = async (req, res) => {
  try {
    const concernsMap = {
      'Barrier Repair': 0,
      'Acne': 0,
      'Uneven Tone': 0,
      'Dryness': 0,
      'Sensitivity': 0,
      'Pigmentation': 0,
    };

    const allProducts = await Product.find({}, 'concernsHandled').lean();
    allProducts.forEach((p) => {
      (p.concernsHandled || []).forEach((c) => {
        if (concernsMap[c] !== undefined) {
          concernsMap[c]++;
        } else {
          concernsMap[c] = 1;
        }
      });
    });

    const formatted = Object.entries(concernsMap).map(([name, count]) => ({
      name,
      count,
    }));

    res.json({ concerns: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQty, price, batchNumber } = req.body;

    const updated = await Product.findByIdAndUpdate(
      id,
      { stockQty, price, batchNumber },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Formulation stock updated', product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const identifier = req.params.slug || req.params.handle;
    const { author, rating, title, comment, concern, role } = req.body;

    if (!author || !comment) {
      return res.status(400).json({ error: 'Author name and review comment are required' });
    }

    const product = await Product.findOne({
      $or: [{ slug: identifier }, { handle: identifier }],
    });

    if (!product) {
      return res.status(404).json({ error: 'Formulation not found' });
    }

    const newReview = {
      author,
      role: role || 'Verified Buyer',
      rating: Number(rating) || 5,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      concern: concern || product.concernsHandled?.[0] || 'General Maintenance',
      title: title || 'Verified formulation observation',
      comment,
      createdAt: new Date(),
    };

    if (!product.reviews) {
      product.reviews = [];
    }
    product.reviews.unshift(newReview);

    // Update aggregate ratings count and average
    const totalReviews = product.reviews.length;
    const totalScore = product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    product.ratings = {
      count: (product.ratings?.count || 48) + 1,
      average: Number((totalScore / totalReviews).toFixed(1)),
    };

    await product.save();

    res.status(201).json({
      message: 'Review successfully uploaded to formulation ledger',
      review: newReview,
      ratings: product.ratings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      price,
      stockQty,
      batchNumber,
      description,
      cureTimeWeeks = 6,
      concernsHandled = ['Barrier Repair'],
      skinTypes = ['All'],
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Formulation name and price are required' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Product.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(409).json({ error: 'A formulation with this slug/name already exists' });
    }

    // Map UI category to schema enum: 'cold-pressed-soaps' | 'lip-care' | 'bundles'
    let schemaCategory = 'cold-pressed-soaps';
    if (/lip/i.test(category)) schemaCategory = 'lip-care';
    if (/bundle/i.test(category)) schemaCategory = 'bundles';

    const newProduct = await Product.create({
      name,
      title: name,
      slug: generatedSlug,
      handle: generatedSlug,
      tagline: 'Artisanal Cold-Saponified Botanical Formulation',
      category: schemaCategory,
      activesConcentration: '10% Active Botanical Lipids',
      price: Number(price),
      stockQty: Number(stockQty) || 30,
      batchNumber: batchNumber || `CUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      curingPeriodDays: Number(cureTimeWeeks) * 7,
      description: description || 'Artisanal cold-saponified skincare formulation crafted with active bio-botanicals.',
      concernsHandled,
      skinTypes,
      images: [
        {
          url: '/images/products/neem-turmeric.jpg',
          alt: name,
          isPrimary: true,
        },
      ],
      ratings: { average: 5.0, count: 1 },
      isVegan: true,
      isFragranceFree: true,
    });

    res.status(201).json({
      success: true,
      message: 'Formulation added to inventory successfully',
      product: newProduct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, stockQty, newTotalStock } = req.body;
    const targetQty = stock !== undefined ? Number(stock) : (stockQty !== undefined ? Number(stockQty) : Number(newTotalStock));

    if (isNaN(targetQty) || targetQty < 0) {
      return res.status(400).json({ error: 'Valid stock quantity (>= 0) is required' });
    }

    const mongoose = require('mongoose');
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: id }, { handle: id }, { name: id }, { title: id }],
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Formulation not found' });
    }

    product.stockQty = targetQty;
    product.stock = targetQty;
    product.status = targetQty <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE';

    if (product.batches && product.batches.length > 0) {
      const activeBatches = product.batches.filter((b) => !b.isWrittenOff);
      if (activeBatches.length > 0) {
        activeBatches[0].stockQuantity = targetQty;
        for (let i = 1; i < activeBatches.length; i++) {
          activeBatches[i].stockQuantity = 0;
        }
      } else {
        product.batches.push({
          batchNumber: `LOT-2026-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          stockQuantity: targetQty,
          status: 'ACTIVE',
        });
      }
    } else {
      product.batches = [
        {
          batchNumber: `LOT-2026-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          stockQuantity: targetQty,
          status: 'ACTIVE',
        },
      ];
    }

    await product.save();

    if (req.io) {
      req.io.emit('product:stock_updated', {
        id: product._id,
        slug: product.slug,
        stock: product.stockQty,
      });
    }

    res.json({
      success: true,
      message: `Stock updated to ${targetQty} units`,
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: id }, { handle: id }],
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Formulation not found' });
    }

    const updates = req.body;
    if (updates.title && !updates.name) updates.name = updates.title;
    if (updates.name && !updates.title) updates.title = updates.name;
    if (updates.stock !== undefined) updates.stockQty = updates.stock;
    if (updates.totalStock !== undefined) updates.stockQty = updates.totalStock;
    if (updates.stockQty !== undefined) updates.stock = updates.stockQty;
    if (updates.phRange) updates.phLevel = updates.phRange;

    Object.assign(product, updates);
    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


