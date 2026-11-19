const { v4: uuidv4 } = require('uuid');
const ConsultationSession = require('../models/ConsultationSession');
const Product = require('../models/Product');
const geminiRoutineService = require('../services/geminiRoutineService');
const { processSamConsultation } = require('../services/samRagService');

exports.consultSkin = async (req, res) => {
  try {
    const { message, skinType, concerns, sensitivities, sessionId } = req.body;

    const currentSessionId = sessionId || `session_${uuidv4()}`;

    const profileInput = {
      skinType: skinType || (req.user && req.user.skinProfile ? req.user.skinProfile.skinType : undefined),
      concerns: concerns || (req.user && req.user.skinProfile ? req.user.skinProfile.concerns : []),
      sensitivities: sensitivities || (req.user && req.user.skinProfile ? req.user.skinProfile.sensitivities : []),
    };

    const userPrompt = message || `Please formulate a clinical routine for ${profileInput.skinType || 'my skin'} addressing concerns: ${(profileInput.concerns || []).join(', ') || 'overall skin health'}`;

    const diagnosticResult = await geminiRoutineService.consultSkinRoutine(userPrompt, profileInput);

    // Save session log
    let session = await ConsultationSession.findOne({ sessionId: currentSessionId });
    if (!session) {
      session = new ConsultationSession({
        sessionId: currentSessionId,
        userId: req.user ? req.user.id : null,
        chatHistory: [],
        diagnosedProfile: diagnosticResult.diagnosedProfile,
        recommendedProductIds: diagnosticResult.recommendedProductIds,
        recommendedRegimen: diagnosticResult.recommendedRegimen,
      });
    }

    session.chatHistory.push({
      sender: 'user',
      text: userPrompt,
      timestamp: new Date(),
    });

    session.chatHistory.push({
      sender: 'assistant',
      text: diagnosticResult.explanation,
      actionPayload: {
        diagnosedProfile: diagnosticResult.diagnosedProfile,
        regimen: diagnosticResult.recommendedRegimen,
      },
      timestamp: new Date(),
    });

    await session.save();

    // Populate products in response
    const recommendedProducts = await Product.find({
      _id: { $in: diagnosticResult.recommendedProductIds },
    });

    res.json({
      sessionId: currentSessionId,
      diagnosedProfile: diagnosticResult.diagnosedProfile,
      recommendedProducts,
      recommendedRegimen: diagnosticResult.recommendedRegimen,
      explanation: diagnosticResult.explanation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.regimenToCart = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Array of productIds is required' });
    }

    const products = await Product.find({ _id: { $in: productIds } });

    let subtotal = 0;
    const cartItems = products.map((p) => {
      subtotal += p.price;
      return {
        productId: p._id,
        name: p.name,
        price: p.price,
        activesConcentration: p.activesConcentration,
        image: p.images && p.images[0] ? p.images[0].url : '',
        quantity: 1,
        isBundleItem: true,
      };
    });

    // 15% discount for complete 3+ product routine
    const discountPercentage = cartItems.length >= 3 ? 15 : cartItems.length === 2 ? 10 : 0;
    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const total = subtotal - discountAmount;

    res.json({
      message: 'Regimen successfully converted to cart bundle',
      cartItems,
      subtotal,
      discountPercentage,
      discountAmount,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Sam RAG Skincare Copilot — POST /api/v1/ai/chat
 * Full retrieval-augmented generation pipeline with Gemini + zero-fail clinical fallback.
 */
exports.chatWithSam = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A valid non-empty "message" string is required.',
      });
    }

    const { reply, actionPayload } = await processSamConsultation(
      message.trim(),
      Array.isArray(history) ? history : []
    );

    res.json({
      success: true,
      reply,
      actionPayload,
    });
  } catch (err) {
    console.error('❌ [Sam RAG Controller Error]:', err);
    res.status(500).json({
      success: false,
      reply: 'I encountered a brief connection issue. Please try sharing your concern again.',
      actionPayload: {
        diagnosedConcerns: [],
        recommendedProducts: [],
        quickReplies: ['Try again', 'Acne & oily skin', 'Dry skin help'],
      },
    });
  }
};
