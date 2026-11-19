/**
 * Love & Co. — Sam AI Botanical Skincare Knowledge Base
 * Full RAG catalog registry, ingredient keyword index, dermatological rules,
 * and deterministic clinical fallback engine.
 */

// ─────────────────────────────────────────────────────────────
// 1. LOVE & CO. PRODUCT CATALOG  (primary RAG retrieval corpus)
// ─────────────────────────────────────────────────────────────
const LOVE_AND_CO_CATALOG = [
  {
    id: 'bloom-soap',
    name: 'LOVE & Co. BLOOM',
    subtitle: 'Neem + Turmeric Cold-Process Soap',
    slug: 'love-and-co-bloom-neem-turmeric-soap',
    category: 'cold-pressed-soaps',
    price: 299,
    mrp: 349,
    volume: '100g bar',
    image: '/images/products/bloom_neem_turmeric_soap.jpg',
    skinTypes: ['Oily', 'Combination', 'Acne-Prone'],
    concernsHandled: [
      'Acne', 'Active Breakouts', 'Pimples', 'Pustules', 'Papules',
      'Excess Sebum', 'Oily Skin', 'Clogged Pores', 'Blackheads',
      'Whiteheads', 'Inflammation', 'Bacterial Congestion', 'Fungal Skin',
    ],
    keyActives: [
      {
        name: 'Neem Leaf Extract (Melia Azadirachta)',
        function: 'Natural antibacterial agent that neutralizes Cutibacterium acnes, calms active papules, and regulates excess sebum.',
      },
      {
        name: 'Turmeric Root Powder (Curcuma Longa)',
        function: 'Botanical anti-inflammatory rich in Curcumin. Reduces erythema, calms pustules, and gradually brightens post-acne dark marks.',
      },
      {
        name: 'Saponified Coconut, Olive & Castor Oils',
        function: 'Cold-process base delivering a dense micro-foam that purifies without stripping the skin\'s acid mantle (pH 4.5–5.5).',
      },
    ],
    phRange: '8.5 - 9.0',
    routineSlot: 'AM & PM',
    routineInstructions: {
      am: 'Wet bar, lather between palms, gently massage onto face for 45 seconds concentrating on breakout zones (forehead, nose, chin), rinse with cool water.',
      pm: 'Repeat AM steps. Allow botanical neem micro-film to contact the skin for 60 seconds before rinsing for deeper antibacterial action.',
    },
    curingDays: 45,
    // Keywords that trigger retrieval of this product
    retrievalKeywords: [
      'acne', 'breakout', 'pimple', 'oily', 'sebum', 'greas', 'blackhead',
      'whitehead', 'blemish', 'congest', 'pustule', 'papule', 'inflam',
      'antibacter', 'neem', 'turmeric', 't-zone', 'forehead pimple', 'cheek acne',
    ],
  },

  {
    id: 'blush-soap',
    name: 'LOVE & Co. BLUSH',
    subtitle: 'Rose + Goat Milk Cold-Process Soap',
    slug: 'love-and-co-blush-rose-goat-milk-soap',
    category: 'cold-pressed-soaps',
    price: 329,
    mrp: 399,
    volume: '100g bar',
    image: '/images/products/blush_rose_goatmilk_soap.jpg',
    skinTypes: ['Dry', 'Sensitive', 'Normal', 'Mature', 'Compromised Barrier'],
    concernsHandled: [
      'Dryness', 'Flakiness', 'Tightness', 'Sensitized Skin', 'Dehydration',
      'Dullness', 'Eczema-Prone', 'Barrier Damage', 'Stinging Skin',
      'Peeling Skin', 'Irritation', 'Moisture Loss',
    ],
    keyActives: [
      {
        name: 'Fresh Goat Milk (Caprae Lac)',
        function: 'Naturally rich in lactic acid (AHA) and barrier-identical fatty acids (Caprylic/Capric Triglyceride). Gently resurfaces dead corneocytes while replenishing the lipid matrix.',
      },
      {
        name: 'Pure Rose Flower Water & Petal Extract (Rosa Damascena)',
        function: 'Calms skin reactivity, restores botanical hydration to sensitized tissue, and mitigates post-wash flushing.',
      },
      {
        name: 'Cold-Pressed Olive & Castor Lipids',
        function: 'Replenishes intercellular lipid matrix (ceramides + fatty acids) to prevent trans-epidermal water loss (TEWL) after cleansing.',
      },
    ],
    phRange: '8.0 - 8.5',
    routineSlot: 'AM & PM',
    routineInstructions: {
      am: 'Create a velvety lather with BLUSH on wet skin. Massage with light pressure for 30 seconds. Pat—never rub—dry with a soft towel.',
      pm: 'Repeat AM. The higher goat milk lactic acid concentration has gentle overnight resurfacing benefit when used consistently.',
    },
    curingDays: 45,
    retrievalKeywords: [
      'dry', 'tight', 'flak', 'parch', 'dehydrat', 'sensitiv', 'irritat',
      'barrier', 'sting', 'moisture', 'goat milk', 'rose', 'eczema',
      'dull', 'rough', 'peeling skin', 'skin peeling',
    ],
  },

  {
    id: 'velvet-soap',
    name: 'LOVE & Co. VELVET',
    subtitle: 'Red Sandalwood + Shea Butter Cold-Process Soap',
    slug: 'love-and-co-velvet-red-sandalwood-shea-butter-soap',
    category: 'cold-pressed-soaps',
    price: 349,
    mrp: 429,
    volume: '100g bar',
    image: '/images/products/velvet_sandalwood_shea_soap.jpg',
    skinTypes: ['All Skin Types', 'Combination', 'Normal', 'Dull Skin'],
    concernsHandled: [
      'Sun Tan', 'Pigmentation', 'Dark Spots', 'Hyperpigmentation',
      'Uneven Skin Tone', 'Uneven Texture', 'Rough Skin', 'Post-Inflammatory Marks',
      'Environmental Dullness', 'UV Damage', 'Beach Tan', 'Body Tan',
    ],
    keyActives: [
      {
        name: 'Red Sandalwood / Rakta Chandana (Pterocarpus Santalinus)',
        function: 'Ayurvedic brightening resin that visibly lifts photo-induced melanin deposits, fades dark marks, and imparts a natural luminosity without synthetic bleaching agents.',
      },
      {
        name: 'Unrefined Raw Shea Butter (Butyrospermum Parkii)',
        function: 'Rich in cinnamic acid (natural SPF booster) and unsaponifiable fractions that deeply soften sun-roughened texture and fill micro-cracks.',
      },
      {
        name: 'Castor & Coconut Cold-Process Base',
        function: 'Generates dense, polishing micro-foam that gently lifts oxidized melanin-laden dead cells from the stratum corneum.',
      },
    ],
    phRange: '8.0 - 8.5',
    routineSlot: 'AM & PM',
    routineInstructions: {
      am: 'Wet bar, lather VELVET on hands, apply to sun-exposed areas. Allow the botanical sandalwood micro-foam to contact skin for 30–45 seconds. Rinse with cool water. Follow with broad-spectrum SPF 50.',
      pm: 'Cleanse all sun-exposed areas with VELVET. The overnight skin renewal cycle enhances melanin clearance. Do not skip sunscreen the following morning.',
    },
    curingDays: 45,
    retrievalKeywords: [
      'tan', 'beach', 'dark spot', 'dark patch', 'pigment', 'uneven',
      'sunburn', 'sun damage', 'rough', 'bump', 'sandalwood', 'shea',
      'melanin', 'discoloration', 'mark', 'spot', 'uv', 'holiday tan',
    ],
  },

  {
    id: 'velisse-balm',
    name: 'Velisse by LOVE & Co.',
    subtitle: 'Rose + Shea Butter Botanical Lip Balm',
    slug: 'velisse-rose-shea-butter-lip-balm',
    category: 'lip-care',
    price: 249,
    mrp: 299,
    volume: '12g',
    image: '/images/products/velisse_rose_lipbalm.jpg',
    skinTypes: ['Universal'],
    concernsHandled: [
      'Chapped Lips', 'Cracked Lips', 'Peeling Lips', 'Lip Dryness',
      'Darkened Lips', 'Dry Lips', 'Sore Lips', 'Bleeding Lips',
    ],
    keyActives: [
      {
        name: 'Unrefined Nilotica Shea Butter',
        function: 'Lipid-dense emollient that immediately fills dry fissures in the fragile vermilion border and seals in cellular moisture.',
      },
      {
        name: 'Cold-Pressed Jojoba Seed Oil (Simmondsia Chinensis)',
        function: 'Biomimetic liquid wax ester with a molecular structure mirroring natural sebum — absorbs instantly with zero greasy residue.',
      },
      {
        name: 'Natural Beeswax (Cera Alba)',
        function: 'Forms a breathable yet robust physical barrier against wind, cold, and low-humidity environments that cause trans-mucosal water loss.',
      },
      {
        name: 'Pure Damascena Rose Oil & Tocopherol (Vitamin E)',
        function: 'Delivers antioxidant protection against environmental oxidative stress while imparting a delicate botanical scent and subtle toning.',
      },
    ],
    routineSlot: 'AM & PM (as needed throughout the day)',
    routineInstructions: {
      am: 'Apply a smooth layer to clean dry lips as a conditioning base before lipstick or direct sun exposure.',
      pm: 'Apply a generous coat as an intensive overnight restorative lip mask — the occlusive beeswax layer seals in hydration during sleep.',
    },
    curingDays: 0,
    retrievalKeywords: [
      'lip', 'lips', 'chapped', 'cracked lip', 'peeling lip', 'dry lip',
      'lip balm', 'lip care', 'lip dark', 'sore lip', 'lip peel',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 2. DERMATOLOGICAL CLINICAL RULES  (injected into RAG prompt)
// ─────────────────────────────────────────────────────────────
const DERM_RULES = [
  'If the user reports active breakouts, oily T-zone, or greasy skin, prioritize LOVE & Co. BLOOM (Neem + Turmeric). Neem combats Cutibacterium acnes; Turmeric calms erythema.',
  'If the user reports dryness, post-wash tightness, flakiness, stinging, or sensitive barrier, prioritize LOVE & Co. BLUSH (Rose + Goat Milk). Lactic acid gently resurfaces; Rose calms reactivity.',
  'If the user reports sun tan, beach tan, dark spots, uneven pigmentation, or rough bumpy texture, prioritize LOVE & Co. VELVET (Red Sandalwood + Shea Butter). Rakta Chandana lifts melanin deposits; Shea restores UV-stressed skin.',
  'If the user reports dry or peeling lips, or requests a complete self-care or full routine, cross-recommend Velisse by LOVE & Co. Lip Balm as the universal finishing step.',
  'Acne + Dry Skin Conflict Rule: If user reports BOTH dry skin AND active breakouts, do NOT prescribe only BLOOM. Prescribe BLOOM for targeted breakout zones (forehead, nose, chin) and BLUSH for overall face to protect the moisture barrier. Explain this dual-zone strategy explicitly.',
  'Pigmentation + Sun Exposure Rule: When recommending VELVET, always pair with strict advice to apply broad-spectrum SPF 50 every morning. Sun protection is mandatory to prevent UV from re-triggering melanin synthesis.',
  'Universal Lip Finishing Rule: Velisse Lip Balm is a universal finishing touch for all AM and PM regimens regardless of primary concern.',
  'Safety Disclaimer (mandatory): Always end responses with: "I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist."',
];

// ─────────────────────────────────────────────────────────────
// 3. GREETING DETECTION
// ─────────────────────────────────────────────────────────────
const GREETING_PHRASES = [
  'hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening',
  'good afternoon', 'good night', 'hola', 'howdy', 'greetings',
  'what\'s up', 'sup', 'yo', 'hai', 'hii', 'hiii', 'heya',
];

function isGreeting(message) {
  const normalized = (message || '').trim().toLowerCase();
  return GREETING_PHRASES.some(
    (g) => normalized === g || normalized.startsWith(g + ' ') || normalized.startsWith(g + '!')
  );
}

// ─────────────────────────────────────────────────────────────
// 4. RAG RETRIEVAL ENGINE  (keyword-based vector approximation)
// ─────────────────────────────────────────────────────────────

/**
 * Scores each catalog product against the user query using keyword matching.
 * Returns products sorted by relevance score (descending), limited to top-N.
 * @param {string} userMessage
 * @param {number} topN   Maximum products to return (default 3)
 * @returns {Array}       Sorted array of matched catalog items
 */
function retrieveRelevantProducts(userMessage, topN = 3) {
  const query = (userMessage || '').toLowerCase();

  const scored = LOVE_AND_CO_CATALOG.map((product) => {
    let score = 0;

    // Keyword match against retrieval index
    for (const kw of product.retrievalKeywords || []) {
      if (query.includes(kw)) score += 3;
    }
    // Concern phrase match
    for (const concern of product.concernsHandled || []) {
      if (query.includes(concern.toLowerCase())) score += 2;
    }
    // Skin type match
    for (const st of product.skinTypes || []) {
      if (query.includes(st.toLowerCase())) score += 2;
    }
    // Product name match
    if (query.includes(product.name.toLowerCase())) score += 5;
    if (query.includes(product.subtitle.toLowerCase())) score += 4;

    return { product, score };
  });

  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);

  // Always include Velisse Lip Balm if lips are mentioned
  const hasLip = /lip|lips|chapped|cracked/i.test(query);
  const velisse = LOVE_AND_CO_CATALOG.find((p) => p.id === 'velisse-balm');
  const hasVelisse = ranked.some((p) => p.id === 'velisse-balm');

  if (hasLip && velisse && !hasVelisse) ranked.push(velisse);

  // If nothing matched, return full catalog (Sam will generalize)
  return ranked.length > 0 ? ranked.slice(0, topN) : LOVE_AND_CO_CATALOG;
}

// ─────────────────────────────────────────────────────────────
// 5. DETERMINISTIC FALLBACK  (no Gemini API available)
// ─────────────────────────────────────────────────────────────
function buildProductPayload(catalogProduct) {
  return {
    id: catalogProduct.id,
    name: catalogProduct.name,
    slug: catalogProduct.slug,
    price: catalogProduct.price,
    volume: catalogProduct.volume,
    image: catalogProduct.image,
    reason: catalogProduct.keyActives[0].function,
  };
}

function evaluateDeterministicConsultation(message = '', history = []) {
  const query = (message + ' ' + history.map((h) => h.text || '').join(' ')).toLowerCase();

  // Check flags
  const hasAcne         = /acne|breakout|pimple|pustule|blackhead|whitehead|blemish|congest/i.test(query);
  const hasOily         = /oily|greas|sebum|shine|t-zone/i.test(query);
  const hasDryness      = /dry|tight|flak|parch|dehydrat|sting|sensitiv|irritat|barrier|moisture/i.test(query);
  const hasPigmentation = /tan|beach|dark spot|dark patch|pigment|uneven tone|sunburn|rough skin|bump/i.test(query);
  const hasLipCare      = /\blip\b|lips|chapped|cracked lip|dry lip|peeling lip|lip balm/i.test(query);

  const diagnosedConcerns = [];
  const recommendedProducts = [];
  let replyText = '';

  const BLOOM   = LOVE_AND_CO_CATALOG.find((p) => p.id === 'bloom-soap');
  const BLUSH   = LOVE_AND_CO_CATALOG.find((p) => p.id === 'blush-soap');
  const VELVET  = LOVE_AND_CO_CATALOG.find((p) => p.id === 'velvet-soap');
  const VELISSE = LOVE_AND_CO_CATALOG.find((p) => p.id === 'velisse-balm');

  // ── Case A: Dry Skin (±Lip, no primary acne/tan) ─────────────
  if (hasDryness && !hasAcne && !hasPigmentation) {
    diagnosedConcerns.push('Barrier Dehydration', 'Impaired Moisture Barrier');
    if (hasLipCare) diagnosedConcerns.push('Chapped / Peeling Lips');
    recommendedProducts.push(buildProductPayload(BLUSH));
    if (hasLipCare) recommendedProducts.push(buildProductPayload(VELISSE));

    replyText = `### Clinical Assessment: Barrier Dehydration & Moisture Loss

When skin feels tight after washing${hasLipCare ? ' and lips are visibly peeling' : ''}, your **acid mantle and stratum corneum lipid matrix have been depleted**. Conventional foaming detergents strip natural ceramides, leaving nerve endings exposed and accelerating trans-epidermal water loss (TEWL).

#### 🌿 Recommended Botanical Prescription:

**1. LOVE & Co. BLUSH — Rose + Goat Milk Soap (₹${BLUSH.price})**
- *Fresh Goat Milk (Caprae Lac)* delivers natural lactic acid and milk triglycerides that hydrate the corneocyte layer without disrupting the acid mantle.
- *Rosa Damascena Flower Extract* calms surface reactivity, reduces post-wash flushing, and restores botanical moisture.

${hasLipCare ? `**2. Velisse by LOVE & Co. Lip Balm (₹${VELISSE.price})**
- Unrefined Shea Butter + Cold-Pressed Jojoba liquid wax form an occlusive botanical seal over micro-fissures, halting lip peeling within days.
- Beeswax shield protects against environmental dehydration triggers (cold, wind, AC).` : ''}

#### ☀️ AM Routine:
- **Cleanse:** Lather BLUSH gently with lukewarm water for 30 seconds. Pat dry — never rub.
- ${hasLipCare ? '**Lip Shield:** Smooth Velisse Lip Balm across lips before stepping into sun or air-conditioning.' : '**Moisturize:** Apply a lightweight barrier cream.'}
- **SPF:** Follow with broad-spectrum SPF 50.

#### 🌙 PM Routine:
- **Purify:** Cleanse with BLUSH to dissolve daytime oxidized debris while replenishing lipid barrier.
- ${hasLipCare ? '**Overnight Lip Recovery:** Apply a generous coat of Velisse as an intensive overnight lip mask.' : '**Replenish:** Apply a ceramide-rich night moisturizer to seal in hydration.'}

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  // ── Case B: Pigmentation / Tan (no primary acne) ─────────────
  else if (hasPigmentation && !hasAcne) {
    diagnosedConcerns.push('UV-Induced Melanin Hyperactivity', 'Sun Tan & Uneven Pigmentation');
    recommendedProducts.push(buildProductPayload(VELVET));
    recommendedProducts.push(buildProductPayload(VELISSE));

    replyText = `### Clinical Assessment: UV-Induced Melanin Hyperactivity & Photo-Stress

Prolonged sun and beach exposure triggers your melanocytes to overproduce melanin as a biological UV-defense mechanism, resulting in **uneven tanning, dark patches, and surface roughness**.

#### 🌿 Recommended Botanical Prescription:

**LOVE & Co. VELVET — Red Sandalwood + Shea Butter Soap (₹${VELVET.price})**
- Authentic *Pterocarpus Santalinus* (Rakta Chandana / Red Sandalwood) is an Ayurvedic brightening botanical that visibly lifts photo-induced melanin deposits from the stratum corneum.
- *Unrefined Raw Shea Butter* replenishes lipids depleted by UV radiation, restoring smooth texture and radiance.

**Velisse by LOVE & Co. Lip Balm (₹${VELISSE.price})**
- Sun exposure dries and darkens the delicate vermilion border. Velisse's Vitamin E + Jojoba + Shea Butter complex repairs photo-damaged lip tissue.

#### ☀️ AM Routine:
- **Cleanse & Brighten:** Lather VELVET, leave on sun-exposed zones for 30–45 seconds. Rinse with cool water.
- **SPF Shield (Non-Negotiable):** Apply broad-spectrum SPF 50. Without SPF, UV will re-trigger melanin synthesis and nullify botanical brightening.
- **Lip Protect:** Apply Velisse before sun exposure.

#### 🌙 PM Routine:
- **Restorative Cleanse:** Cleanse with VELVET. The overnight skin renewal cycle (peak cell turnover 11 PM–2 AM) amplifies de-tanning benefits.
- **Lip Recovery:** Generous overnight coat of Velisse.

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  // ── Case C: Acne + Dry Skin (conflict) ───────────────────────
  else if (hasAcne && hasDryness) {
    diagnosedConcerns.push('Acne-Barrier Conflict', 'Sebum Congestion', 'Compromised Moisture Barrier');
    recommendedProducts.push(buildProductPayload(BLOOM));
    recommendedProducts.push(buildProductPayload(BLUSH));
    if (hasLipCare) recommendedProducts.push(buildProductPayload(VELISSE));

    replyText = `### Clinical Assessment: Acne-Barrier Conflict — Dual-Zone Strategy Required

Your skin presents a clinical paradox: active congestion (excess sebum, bacteria) alongside a compromised moisture barrier (dryness, tightness). **Using only harsh anti-acne cleansers will strip remaining lipids and trigger rebound sebum overproduction.**

#### 🌿 Dual-Zone Botanical Protocol:

**Zone 1 — LOVE & Co. BLOOM on T-Zone (Forehead, Nose, Chin) — ₹${BLOOM.price}**
- *Neem Extract* directly targets *Cutibacterium acnes* on congested zones without systemic dryness.
- Apply BLOOM as a targeted spot cleanser on the T-zone for 45–60 seconds.

**Zone 2 — LOVE & Co. BLUSH on Cheeks & Dry Areas — ₹${BLUSH.price}**
- *Goat Milk Lactic Acid* gently conditions dry corneocytes on cheeks without feeding bacterial congestion.
- Apply BLUSH on cheeks and jaw for 30 seconds using light, gentle pressure.

#### ☀️ AM Routine:
- Apply BLOOM to T-zone, BLUSH to dry cheek zones simultaneously.
- Rinse with cool water. Pat dry gently.
- Apply lightweight non-comedogenic moisturizer + SPF 50.

#### 🌙 PM Routine:
- Repeat dual-zone cleanse.
- Allow BLOOM's Neem actives to contact T-zone for a full 60 seconds PM for deeper purification.
- Seal with a lightweight barrier repair serum.

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  // ── Case D: Acne / Oily ───────────────────────────────────────
  else if (hasAcne || hasOily) {
    diagnosedConcerns.push('Active Acne Vulgaris', 'Sebaceous Hyperactivity');
    if (hasOily) diagnosedConcerns.push('Excess Sebum Production');
    recommendedProducts.push(buildProductPayload(BLOOM));
    recommendedProducts.push(buildProductPayload(VELISSE));

    replyText = `### Clinical Assessment: Microbial Proliferation & Sebum Congestion

Active breakouts and an oily T-zone indicate **follicular colonization by *Cutibacterium acnes* combined with androgen-driven sebaceous hyperactivity**. Harsh synthetic cleansers create a vicious cycle: they over-strip the barrier → the skin defensively pumps more sebum → more congestion follows.

#### 🌿 Recommended Botanical Prescription:

**LOVE & Co. BLOOM — Neem + Turmeric Soap (₹${BLOOM.price})**
- *Neem Leaf Extract* contains natural Nimbin, Nimbidin, and Azadirachtin — phyto-compounds that directly neutralize acne-causing bacteria at the follicular level.
- *Curcumin from Wild Turmeric* suppresses pro-inflammatory cytokines (IL-1β, TNF-α), visibly shrinking active papules within 7–14 days of consistent use.
- Cold-saponified base cleanses without stripping, avoiding the rebound oil surge.

#### ☀️ AM Routine:
- Work BLOOM into a micro-lather. Gently massage onto wet face for 45 seconds — concentrate on forehead, nose, chin.
- Rinse with cool water (hot water dilates pores and increases sebum flow).
- Apply lightweight water-based moisturizer (non-comedogenic) + SPF 50.
- Finish with Velisse Lip Balm.

#### 🌙 PM Routine:
- Repeat with BLOOM. Allow 60-second contact for deeper pore purification.
- Avoid heavy night creams on breakout zones — use a lightweight ceramide serum instead.

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  // ── Case E: Pure Lip Care ─────────────────────────────────────
  else if (hasLipCare) {
    diagnosedConcerns.push('Dry & Chapped Lips', 'Vermilion Barrier Dehydration');
    recommendedProducts.push(buildProductPayload(VELISSE));

    replyText = `### Clinical Assessment: Fragile Vermilion Border Dehydration

The skin on your lips has **no sebaceous oil glands** and is only 3–5 cell layers thin — making it the most vulnerable skin surface on the face. Without a protective lipid film, moisture evaporates rapidly causing chapping, micro-fissures, and eventual peeling.

#### 🌿 Recommended Botanical Prescription:

**Velisse by LOVE & Co. — Rose + Shea Butter Lip Balm (₹${VELISSE.price})**
- *Unrefined Nilotica Shea Butter* immediately fills fissures with a lipid-dense cushion, halting moisture loss at the source.
- *Natural Beeswax (Cera Alba)* creates a breathable physical occlusive barrier — superior to petroleum-based balms for healing broken skin.
- *Cold-Pressed Jojoba* absorbs rapidly without greasy film, conditioning the vermilion border throughout the day.
- *Vitamin E & Damascena Rose Oil* deliver antioxidant protection and gradual toning.

#### ☀️ AM & PM Routine:
- **AM:** Apply a smooth layer to clean lips each morning as a base conditioning layer before lipstick or before going outside.
- **Throughout Day:** Reapply as needed — particularly after eating or drinking.
- **PM (Overnight Mask):** Apply a generous coat before sleep for intensive overnight restoration.

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  // ── Case F: Greeting / General ───────────────────────────────
  else {
    diagnosedConcerns.push('Skin Consultation Initiated');
    recommendedProducts.push(buildProductPayload(BLOOM));
    recommendedProducts.push(buildProductPayload(BLUSH));

    replyText = `Hello! I'm **Sam**, your official Botanical Skincare Copilot here at **Love & Co.** 🌿

I'm grounded in clinical dermatology and authentic cold-saponified botanical formulations. I can help you build a personalized skincare routine using our four hero formulations.

To craft your exact prescription, could you tell me:

1. **Your skin type:** Oily, Dry, Combination, or Sensitive?
2. **Your primary concern right now:**
   - Active acne, breakouts, or oily/greasy skin?
   - Dry, tight, flaky, or sensitized barrier?
   - Sun tan, dark spots, or uneven pigmentation?
   - Chapped or peeling lips?

Feel free to describe your skin in your own words, or tap one of the quick options below!

*I am your botanical skincare AI copilot. For acute dermatological conditions, always consult a licensed dermatologist.*`;
  }

  return {
    reply: replyText,
    actionPayload: {
      diagnosedConcerns,
      recommendedProducts,
      quickReplies: [
        'Acne on forehead & oily nose',
        'Dry, tight skin & peeling lips',
        'Beach tan & dark marks',
        'Both acne and dry skin',
        'Show full routine for my skin',
      ],
    },
  };
}

module.exports = {
  LOVE_AND_CO_CATALOG,
  DERM_RULES,
  GREETING_PHRASES,
  isGreeting,
  retrieveRelevantProducts,
  evaluateDeterministicConsultation,
  // Legacy alias kept for backward compat
  PRODUCTS: {
    BLOOM:           LOVE_AND_CO_CATALOG.find((p) => p.id === 'bloom-soap'),
    BLUSH:           LOVE_AND_CO_CATALOG.find((p) => p.id === 'blush-soap'),
    VELVET:          LOVE_AND_CO_CATALOG.find((p) => p.id === 'velvet-soap'),
    VELISSE_LIP_BALM: LOVE_AND_CO_CATALOG.find((p) => p.id === 'velisse-balm'),
  },
};
