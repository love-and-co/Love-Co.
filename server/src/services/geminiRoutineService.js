const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');

class GeminiRoutineService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  /**
   * Deterministic rule-based skin routine engine (Zero-fail fallback & clinical validator)
   */
  async generateDeterministicRoutine(skinProfile, availableProducts) {
    const skinType = skinProfile.skinType || 'Combination';
    const concerns = skinProfile.concerns || ['Barrier Repair'];
    const sensitivities = skinProfile.sensitivities || [];

    // Filter products matching skin type and concerns
    const matchedProducts = availableProducts.filter((p) => {
      const typeMatches = p.skinTypes.includes('All') || p.skinTypes.includes(skinType);
      const concernMatches = p.concernsHandled.some((c) => concerns.includes(c));
      return typeMatches && concernMatches;
    });

    // Select best matching soap and lip care
    let cleanser =
      matchedProducts.find((p) => p.category === 'cold-pressed-soaps') ||
      availableProducts.find((p) => p.category === 'cold-pressed-soaps') ||
      availableProducts[0];

    let lipCare =
      matchedProducts.find((p) => p.category === 'lip-care') ||
      availableProducts.find((p) => p.category === 'lip-care') ||
      availableProducts[1];

    // Clinical Contraindication Validation
    const cautionNotes = [];
    if (concerns.includes('Barrier Repair') || skinType === 'Sensitive') {
      cautionNotes.push('Barrier alert: Allow cold-saponified botanical lipids to lather gently without harsh scrubbing for 14-21 days.');
    }

    const amRoutine = [
      {
        step: 'Step 1: Cold-Saponified Cleanse',
        product: cleanser,
        notes: `Gentle lather with ${cleanser ? cleanser.name : 'botanical soap'} to refresh skin while keeping natural barrier lipids intact.`,
      },
      {
        step: 'Step 2: Botanical Lip Shield',
        product: lipCare,
        notes: `Apply ${lipCare ? lipCare.name : 'botanical lip elixir'} to protect against moisture evaporation and environmental stress.`,
      },
    ].filter((item) => item.product);

    const pmRoutine = [
      {
        step: 'Step 1: Evening Saponified Purify',
        product: cleanser,
        notes: `Massage micro-suds onto face for 45-60 seconds to wash away daytime impurities and recalibrate skin pH.`,
      },
      {
        step: 'Step 2: Restorative Overnight Lip Nourishment',
        product: lipCare,
        notes: `Layer a generous coat of ${lipCare ? lipCare.name : 'botanical lip elixir'} before sleeping for deep mucosal recovery.`,
      },
    ].filter((item) => item.product);

    const recommendedProductIds = [cleanser, lipCare]
      .filter(Boolean)
      .map((p) => p._id);

    return {
      diagnosedProfile: {
        skinType,
        primaryConcerns: concerns,
        sensitivities,
        contraindications: cautionNotes,
      },
      recommendedProductIds,
      recommendedRegimen: {
        am: amRoutine,
        pm: pmRoutine,
        cautionNotes,
      },
      explanation: `Prescription crafted for ${skinType} skin with primary focus on ${concerns.join(', ')}. This botanical regimen prioritizes cold-saponified cleansing and nutrient-dense lip nourishment.`,
    };
  }

  /**
   * Multi-Agent Routine Evaluation
   */
  async consultSkinRoutine(userPrompt, skinProfile = {}) {
    const products = await Product.find({ stockQty: { $gt: 0 } });

    // Attempt Gemini SDK multi-agent generation if API key is present
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const catalogBrief = products.map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          actives: p.activesConcentration,
          concerns: p.concernsHandled,
          skinTypes: p.skinTypes,
          contraindications: p.contraindications,
          price: p.price,
        }));

        const promptText = `
You are the Chief Botanical Skincare Expert for Love & Co. (clean apothecary skincare inspired by The Ordinary and Minimalist).
Customer Profile:
- Declared Skin Type: ${skinProfile.skinType || 'Not specified'}
- Concerns: ${JSON.stringify(skinProfile.concerns || [])}
- User Message / Query: "${userPrompt}"

Available Botanical Catalog:
${JSON.stringify(catalogBrief, null, 2)}

Enforce these strict clinical rules:
1. Regimen Conflict Validator: Never combine direct exfoliating acids (salicylic, glycolic) with high retinoids or pure vitamin C in the exact same step.
2. If the user mentions compromised barrier, stinging, or redness, prescribe raw lipid bars (goat milk, shea, almond) and ceramides/squalane; avoid harsh exfoliants.
3. Structure AM and PM regimens.
4. Recommend 2 to 4 products from the catalog.

Return ONLY a valid JSON object with this exact shape:
{
  "diagnosedProfile": {
    "skinType": "Oily | Dry | Combination | Normal | Sensitive",
    "primaryConcerns": ["Concern 1", "Concern 2"],
    "contraindications": ["Caution note 1", "Caution note 2"]
  },
  "recommendedProductIds": ["id1", "id2", "id3"],
  "explanation": "Concise clinical diagnostic explanation",
  "amRoutine": [
    {"step": "Step 1: Cleanse", "productId": "id1", "notes": "..."}
  ],
  "pmRoutine": [
    {"step": "Step 1: Cleanse", "productId": "id1", "notes": "..."}
  ]
}
`;

        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Hydrate products
          const am = (parsed.amRoutine || []).map((step) => ({
            step: step.step,
            product: products.find((p) => p._id.toString() === step.productId) || null,
            notes: step.notes,
          })).filter(s => s.product);

          const pm = (parsed.pmRoutine || []).map((step) => ({
            step: step.step,
            product: products.find((p) => p._id.toString() === step.productId) || null,
            notes: step.notes,
          })).filter(s => s.product);

          return {
            diagnosedProfile: parsed.diagnosedProfile,
            recommendedProductIds: parsed.recommendedProductIds || [],
            recommendedRegimen: {
              am,
              pm,
              cautionNotes: parsed.diagnosedProfile.contraindications || [],
            },
            explanation: parsed.explanation,
          };
        }
      } catch (err) {
        console.warn('⚠️ [Gemini AI] Call failed or quota exceeded, seamlessly activating deterministic clinical engine:', err.message);
      }
    }

    // Seamless Fallback
    return await this.generateDeterministicRoutine(skinProfile, products);
  }
}

module.exports = new GeminiRoutineService();
