/**
 * Love & Co. — Sam RAG (Retrieval-Augmented Generation) Service
 *
 * Pipeline:
 *  1. Greeting detection  →  warm welcome response
 *  2. Entity extraction   →  identify skin type, concern, symptoms
 *  3. Catalog retrieval   →  keyword-scored product matching
 *  4. Prompt assembly     →  inject retrieved context + DERM_RULES into Gemini system prompt
 *  5. Gemini generation   →  gemini-1.5-flash with structured JSON action block
 *  6. JSON extraction     →  parse ```json_action block, sanitize product slugs/prices
 *  7. Deterministic fallback → zero-fail clinical engine when Gemini unavailable
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  LOVE_AND_CO_CATALOG,
  DERM_RULES,
  isGreeting,
  retrieveRelevantProducts,
  evaluateDeterministicConsultation,
} = require('../knowledge/skinKnowledgeBase');

// ─────────────────────────────────────────────────────────────
// SAM SYSTEM INSTRUCTION  (injected on every Gemini call)
// ─────────────────────────────────────────────────────────────
const SAM_BASE_SYSTEM_INSTRUCTION = `
You are "Sam", the official AI Botanical Skincare Copilot for the luxury D2C brand "Love & Co.".
Your persona: clinical, empathetic, knowledgeable in dermatology, warm, and trustworthy.
You ONLY recommend products from the Love & Co. catalog provided to you. Never invent or reference external brands.

CONSULTATION PROTOCOL:
1. ENTITY EXTRACTION: Identify the user's skin type (Oily/Dry/Combination/Sensitive), primary concern, and any barrier symptoms.
2. CLINICAL DIAGNOSIS: Briefly explain the dermatological mechanism behind their concern (e.g., excess sebum, compromised lipid matrix, UV melanin oxidation).
3. BOTANICAL PRESCRIPTION: Recommend the exact Love & Co. product(s) from the retrieved knowledge base. Explain WHY each key botanical active resolves their specific concern.
4. ROUTINE: Provide a clean AM and PM routine as bullet points.
5. JSON ACTION BLOCK: End EVERY response where products are recommended with a structured block exactly like this:

\`\`\`json_action
{
  "diagnosedConcerns": ["..."],
  "recommendedProducts": [
    {
      "id": "product-id",
      "name": "Product Name",
      "slug": "product-slug",
      "price": 299,
      "volume": "100g bar",
      "reason": "One-line botanical rationale"
    }
  ],
  "quickReplies": ["How do I use this?", "What about sun tan?", "Show full AM/PM routine"]
}
\`\`\`

TONE RULES:
- Use clinical yet warm language. Never use medical jargon without a plain-English follow-up.
- Keep the total response concise (max ~350 words in the prose section).
- Always end with: "I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist."
- Do NOT include any products not in the catalog.
`;

// ─────────────────────────────────────────────────────────────
// GREETING RESPONSE (bypasses Gemini for speed)
// ─────────────────────────────────────────────────────────────
const SAM_GREETING_RESPONSE = {
  reply: `Hello! I'm **Sam**, your botanical skincare and formulation copilot at **Love & Co.** 🌿

Whether you're looking to clear active breakouts, deeply hydrate a dry barrier, fade sun tan, or heal chapped lips — I'm here to analyze your skin and formulate a personalized clinical routine using our cold-saponified botanical formulations.

To begin, could you share:
1. **Your skin type** — Oily, Dry, Combination, or Sensitive?
2. **Your primary skin concern today** — acne, dryness, dark spots, or lip care?

Feel free to describe in your own words, or tap a quick option below!

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`,
  actionPayload: {
    diagnosedConcerns: [],
    recommendedProducts: [],
    quickReplies: [
      'I have stubborn acne & oily skin',
      'Dry, tight skin after washing',
      'Beach tan & dark spots on my face',
      'Chapped & peeling lips',
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// JSON ACTION BLOCK PARSER
// ─────────────────────────────────────────────────────────────
function parseActionPayload(rawText) {
  if (!rawText) return { cleanText: '', actionPayload: null };

  let actionPayload = null;
  let cleanText = rawText;

  // Primary: ```json_action ... ```
  const jsonActionRegex = /```json_action\s*([\s\S]*?)\s*```/i;
  const match = rawText.match(jsonActionRegex);

  if (match && match[1]) {
    try {
      actionPayload = JSON.parse(match[1].trim());
      cleanText = rawText.replace(jsonActionRegex, '').trim();
    } catch (e) {
      console.warn('⚠️ [Sam RAG] Failed to parse ```json_action block:', e.message);
    }
  }

  // Fallback: standard ```json block containing recommendedProducts
  if (!actionPayload) {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/i;
    const jsonMatch = rawText.match(jsonRegex);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && (parsed.recommendedProducts || parsed.diagnosedConcerns)) {
          actionPayload = parsed;
          cleanText = rawText.replace(jsonRegex, '').trim();
        }
      } catch (_) { /* ignore */ }
    }
  }

  // Sanitize product entries against known catalog
  if (actionPayload && Array.isArray(actionPayload.recommendedProducts)) {
    actionPayload.recommendedProducts = actionPayload.recommendedProducts.map((p) => {
      const catalogEntry = LOVE_AND_CO_CATALOG.find(
        (prod) =>
          prod.slug === p.slug ||
          prod.id === p.id ||
          (prod.name || '').toLowerCase() === (p.name || '').toLowerCase()
      );
      if (catalogEntry) {
        return {
          id:     catalogEntry.id,
          name:   catalogEntry.name,
          slug:   catalogEntry.slug,
          price:  catalogEntry.price,
          volume: catalogEntry.volume,
          image:  catalogEntry.image,
          reason: p.reason || catalogEntry.keyActives[0]?.function || '',
        };
      }
      // Non-catalog entry — keep as-is but add image placeholder
      return { ...p, image: p.image || '/images/products/bloom_neem_turmeric_soap.jpg' };
    });
  }

  return { cleanText, actionPayload };
}

// ─────────────────────────────────────────────────────────────
// BUILD RAG-AUGMENTED PROMPT
// ─────────────────────────────────────────────────────────────
function buildRagPrompt(userMessage, retrievedProducts) {
  const productContext = JSON.stringify(
    retrievedProducts.map((p) => ({
      id:              p.id,
      name:            p.name,
      slug:            p.slug,
      price:           p.price,
      volume:          p.volume,
      skinTypes:       p.skinTypes,
      concernsHandled: p.concernsHandled,
      keyActives:      p.keyActives,
      routineSlot:     p.routineSlot,
      routineInstructions: p.routineInstructions,
    })),
    null,
    2
  );

  return `${SAM_BASE_SYSTEM_INSTRUCTION}

─────────────────────────────────────
RETRIEVED PRODUCT KNOWLEDGE (RAG Context):
${productContext}

CLINICAL DERMATOLOGY RULES TO FOLLOW:
${DERM_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n')}
─────────────────────────────────────

USER MESSAGE: "${userMessage}"

Respond now following the consultation protocol. Include the JSON action block at the very end.`;
}

// ─────────────────────────────────────────────────────────────
// FORMAT HISTORY FOR GEMINI
// ─────────────────────────────────────────────────────────────
function formatHistoryForGemini(history = []) {
  const formatted = [];

  for (const item of history) {
    if (!item.text || !item.text.trim()) continue;
    const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';

    if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
      // Merge consecutive same-role messages
      formatted[formatted.length - 1].parts[0].text += `\n${item.text}`;
    } else {
      formatted.push({ role, parts: [{ text: item.text }] });
    }
  }

  // Gemini requires history to start with 'user' turn
  if (formatted.length > 0 && formatted[0].role !== 'user') {
    formatted.shift();
  }

  return formatted;
}

// ─────────────────────────────────────────────────────────────
// MAIN RAG PIPELINE ENTRY POINT
// ─────────────────────────────────────────────────────────────

/**
 * Process a Sam consultation through the full RAG pipeline.
 * @param {string}   userMessage         The latest message from the user.
 * @param {Array}    conversationHistory Array of { role: 'user'|'model', text: string }
 * @returns {Promise<{reply: string, actionPayload: object|null}>}
 */
async function processSamConsultation(userMessage, conversationHistory = []) {
  const trimmedMsg = (userMessage || '').trim();
  if (!trimmedMsg) throw new Error('Message is required for Sam consultation.');

  // ── STEP 1: Greeting Detection ──────────────────────────────
  if (isGreeting(trimmedMsg) && conversationHistory.length === 0) {
    console.log('👋 [Sam RAG] Greeting detected — returning warm welcome.');
    return SAM_GREETING_RESPONSE;
  }

  // ── STEP 2: RAG Retrieval ───────────────────────────────────
  const retrievedProducts = retrieveRelevantProducts(trimmedMsg, 3);
  console.log(
    `🔍 [Sam RAG] Retrieved ${retrievedProducts.length} products: ${retrievedProducts.map((p) => p.name).join(', ')}`
  );

  // ── STEP 3: Try Gemini API ──────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1400,
        },
      });

      // Build RAG-augmented prompt from retrieved context
      const ragPrompt = buildRagPrompt(trimmedMsg, retrievedProducts);

      // Format conversation history for multi-turn support
      const geminiHistory = formatHistoryForGemini(conversationHistory);

      // Use generateContent with history + RAG prompt for full context
      const contents = [
        ...geminiHistory,
        { role: 'user', parts: [{ text: ragPrompt }] },
      ];

      const result = await model.generateContent({ contents });
      const rawResponse = result.response.text();

      // ── STEP 4: Parse JSON Action Block ─────────────────────
      const { cleanText, actionPayload } = parseActionPayload(rawResponse);

      console.log('✅ [Sam RAG] Gemini response generated successfully.');
      return {
        reply: cleanText || rawResponse,
        actionPayload: actionPayload || {
          diagnosedConcerns: ['Botanical Skincare Consultation'],
          recommendedProducts: retrievedProducts.slice(0, 2).map((p) => ({
            id:     p.id,
            name:   p.name,
            slug:   p.slug,
            price:  p.price,
            volume: p.volume,
            image:  p.image,
            reason: p.keyActives[0]?.function || '',
          })),
          quickReplies: ['How do I use this?', 'Show full AM/PM routine', 'What are the ingredients?'],
        },
      };
    } catch (geminiError) {
      console.warn(
        '⚠️ [Sam RAG] Gemini API failed — gracefully falling back to clinical engine:',
        geminiError.message
      );
    }
  } else {
    console.log('🌱 [Sam RAG] No Gemini API key found — using deterministic clinical engine.');
  }

  // ── STEP 5: Deterministic Clinical Fallback ─────────────────
  return evaluateDeterministicConsultation(trimmedMsg, conversationHistory);
}

module.exports = { processSamConsultation };

