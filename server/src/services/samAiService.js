/**
 * Love & Co. — Sam AI Botanical Skincare Copilot Service
 * Powered by Google Generative AI SDK (Gemini) with zero-fail clinical fallback.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PRODUCTS, evaluateDeterministicConsultation } = require('../knowledge/skinKnowledgeBase');

const SAM_SYSTEM_INSTRUCTION = `
You are "Sam", the official AI Botanical Skincare Copilot for the luxury brand "Love & Co.".
Your purpose is to provide warm, personalized, clinical yet natural skincare guidance. You deeply understand dermatology, skin barriers, sebum dynamics, and botanical formulations.

Here is the Love & Co. botanical formulation catalog you strictly prescribe from:
1. "LOVE & Co. BLOOM" (slug: "love-and-co-bloom-neem-turmeric-soap", variant: "100g", price: 299)
   - Actives: Pure Neem Leaf Extract (Melia Azadirachta) + Wild Turmeric Root Powder (Curcuma Longa) in cold-process saponified Coconut, Olive, Castor oils.
   - Purpose: Antimicrobial, anti-inflammatory, sebum regulating. Prescribe for active acne, pustules, breakouts, blackheads, excess oil, shiny T-zone, congestion.
2. "LOVE & Co. BLUSH" (slug: "love-and-co-blush-rose-goat-milk-soap", variant: "100g", price: 329)
   - Actives: Fresh Farm Goat Milk (Caprae Lac rich in Lactic Acid & lipids) + Pure Rose Petal Flower Extract in cold-process base.
   - Purpose: Deep hydration, barrier replenishment, lactic smoothing. Prescribe for dry skin, post-wash tightness, flakiness, sensitive or stinging barrier.
3. "LOVE & Co. VELVET" (slug: "love-and-co-velvet-red-sandalwood-shea-butter-soap", variant: "100g", price: 349)
   - Actives: Authentic Rakta Chandana (Red Sandalwood - Pterocarpus Santalinus) + Unrefined Raw Shea Butter.
   - Purpose: Lifting sun tan, fading dark patches/melanin deposits, smoothing rough micro-texture and bumps. Prescribe for beach tan, hyperpigmentation, uneven tone, texture.
4. "Velisse by LOVE & Co. Lip Balm" (slug: "velisse-rose-shea-butter-lip-balm", variant: "12g", price: 249)
   - Actives: Unrefined Shea Butter, Cold-Pressed Jojoba Oil, Natural Beeswax Shield, Damascena Rose Oil, Vitamin E.
   - Purpose: Occlusive seal, chapping repair. Prescribe for dry, cracked, peeling lips. Universal finishing touch for all routines.

Clinical Consultation Rules:
- Acne + Dry Skin Conflict: If user has dry skin AND acne, do NOT prescribe harsh drying cleansers. Prescribe BLOOM for targeted breakout zones and BLUSH for overall face moisture to protect the barrier.
- Pigmentation + Sun: Recommend VELVET paired with strict morning broad-spectrum SPF 50 sunscreen advice.
- Universal Lip Finishing: Always cross-recommend Velisse Lip Balm as the universal finishing touch.
- Tone: Warm, scientific, empathetic, concise, luxurious.
- Safety Disclaimer: Always include: "I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist."

Follow this consultation protocol:
1. ASSESSMENT: If user message is vague ("my skin is bad", "help"), ask 1-2 focused questions about skin type (Oily, Dry, Combination, Sensitive) and top concern.
2. DIAGNOSIS: Explain concisely WHY their skin behaves that way (impaired barrier, excess sebum, follicular congestion, UV oxidation).
3. PRESCRIPTION: Recommend matching Love & Co. products (BLOOM, BLUSH, VELVET, Velisse Lip Balm). Explain the role of key botanical ingredients.
4. ROUTINE STEPS: Provide a simple AM and PM routine table or bullet list.
5. JSON ACTION PAYLOAD: Conclude EVERY consultation where products are recommended with a structured JSON block enclosed in \`\`\`json_action:
\`\`\`json_action
{
  "diagnosedConcerns": ["Acne", "Oily Skin"],
  "recommendedProducts": [
    {
      "slug": "love-and-co-bloom-neem-turmeric-soap",
      "name": "LOVE & Co. BLOOM",
      "variant": "100g",
      "price": 299,
      "reason": "Neem and Turmeric provide antimicrobial calming for active breakouts."
    }
  ],
  "quickReplies": ["How do I use this?", "What about dark spots?", "Show full routine"]
}
\`\`\`
Always be polite, concise, and avoid overwhelming the user with long medical jargon. Keep the tone luxurious and trustworthy.
`;

class SamAiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
    this.client = null;
    if (this.apiKey) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
      } catch (err) {
        console.warn('⚠️ [Sam AI] Could not initialize GoogleGenerativeAI:', err.message);
      }
    }
  }

  /**
   * Helper to parse JSON action block from Gemini raw output
   */
  parseActionPayload(text) {
    if (!text) return { cleanText: '', actionPayload: null };

    let actionPayload = null;
    let cleanText = text;

    // Pattern 1: ```json_action ... ```
    const jsonActionRegex = /```json_action\s*([\s\S]*?)\s*```/i;
    const match = text.match(jsonActionRegex);

    if (match && match[1]) {
      try {
        actionPayload = JSON.parse(match[1].trim());
        cleanText = text.replace(jsonActionRegex, '').trim();
      } catch (e) {
        console.warn('⚠️ [Sam AI] Failed to parse ```json_action block:', e.message);
      }
    }

    // Pattern 2: Fallback to standard ```json block if contains recommendedProducts
    if (!actionPayload) {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/i;
      const jsonMatch = text.match(jsonRegex);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed && (parsed.recommendedProducts || parsed.diagnosedConcerns)) {
            actionPayload = parsed;
            cleanText = text.replace(jsonRegex, '').trim();
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // Sanitize recommended products to ensure valid slugs and images
    if (actionPayload && Array.isArray(actionPayload.recommendedProducts)) {
      actionPayload.recommendedProducts = actionPayload.recommendedProducts.map((p) => {
        // Find product in catalog if possible to ensure accurate pricing and image
        const catalogMatch = Object.values(PRODUCTS).find(
          (prod) => prod.slug === p.slug || prod.name.toLowerCase() === (p.name || '').toLowerCase()
        );
        return {
          slug: catalogMatch ? catalogMatch.slug : p.slug,
          name: catalogMatch ? catalogMatch.name : p.name,
          variant: p.variant || (catalogMatch ? catalogMatch.variant : '100g'),
          price: catalogMatch ? catalogMatch.price : (p.price || 299),
          reason: p.reason || (catalogMatch ? catalogMatch.primaryAction : ''),
          image: catalogMatch ? catalogMatch.image : '/images/products/bloom_neem_turmeric_soap.jpg',
        };
      });
    }

    return { cleanText, actionPayload };
  }

  /**
   * Main chat consultation method
   * @param {Object} options
   * @param {string} options.message - The latest user query
   * @param {Array} options.history - Array of { role: 'user' | 'model', text: string }
   */
  async chat({ message, history = [] }) {
    const userMessage = (message || '').trim();
    if (!userMessage) {
      throw new Error('Message is required for Sam AI consultation.');
    }

    // Check if Gemini API is available and key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        if (!this.client || this.apiKey !== apiKey) {
          this.apiKey = apiKey;
          this.client = new GoogleGenerativeAI(this.apiKey);
        }

        // Format history for Gemini chat
        // Filter and ensure proper role alternation (user, model, user, ...)
        const formattedHistory = [];
        for (const item of history) {
          if (!item.text || !item.text.trim()) continue;
          const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
          // Avoid duplicate consecutive roles
          if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
            formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${item.text}`;
          } else {
            formattedHistory.push({
              role,
              parts: [{ text: item.text }],
            });
          }
        }

        // Gemini startChat history must start with a 'user' turn if not empty
        if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
          formattedHistory.shift();
        }

        const model = this.client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: SAM_SYSTEM_INSTRUCTION,
        });

        const chatSession = model.startChat({
          history: formattedHistory,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        });

        const result = await chatSession.sendMessage(userMessage);
        const rawResponse = result.response.text();

        const { cleanText, actionPayload } = this.parseActionPayload(rawResponse);

        return {
          reply: cleanText,
          actionPayload: actionPayload || {
            diagnosedConcerns: ['Botanical Skincare Consultation'],
            recommendedProducts: [],
            quickReplies: ['Show full routine', 'How do I use this?', 'Recommend cold-pressed soaps'],
          },
        };
      } catch (geminiError) {
        console.warn('⚠️ [Sam AI] Gemini API call encountered an issue, gracefully utilizing clinical fallback:', geminiError.message);
        // Seamlessly fall through to deterministic clinical evaluator
      }
    }

    // Zero-Fail Clinical Fallback
    console.log('🌱 [Sam AI] Executing dermatologically grounded clinical rule-based engine...');
    return evaluateDeterministicConsultation(userMessage, history);
  }
}

module.exports = new SamAiService();

