# Love & Co. — System Specification Document (SDD)
**E-Commerce Web Application for Cold-Pressed Soaps, Artisanal Lip Balms, & Botanical Skincare**  
*Document Version: 1.0.0 | Status: Ready for Engineering Execution | Architecture: Spec-Driven Full-Stack + Agentic Copilot*

---

## 1. Project Overview & Tech Stack

### 1.1 Executive Summary
**Love & Co.** is a direct-to-consumer (D2C) e-commerce web platform specializing in organic, cold-pressed soaps, lip care essentials, handcrafted balms, and natural skincare serums. The application is built around transparent formulation, clinical purity, sustainable botanicals, and bespoke skin routine recommendations.

The UI/UX benchmark blends the understated, clinical typography of **The Ordinary** with the clean, contrast-rich, modular layout of **Minimalist (beminimalist.co)**:
* High-contrast monochrome palettes softened with warm organic alabaster/stone undertones.
* Information-dense yet uncluttered product displays, ingredient percentage badges, skin concern navigation, custom bundle builders, and an interactive **AI Botanical Routine & Skin Diagnostics Copilot**.

---

### 1.2 Technology Stack Matrix

| Layer | Technology Choice | Rationalization |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (Pages Router), React 19** | Standardized SSR/SSG for SEO, instantaneous page transitions, high reliability. |
| **Styling & Icons** | **Tailwind CSS, Lucide React** | Clinical utility classes, minimal CSS footprint, sleek architectural iconography. |
| **State Management** | **Zustand** | Lightweight, reactive client stores for Cart, User Auth, Active Skin Profile, and Filter States. |
| **Backend & Runtime** | **Node.js, Express.js** | Modular REST architecture, high-throughput asynchronous execution. |
| **Database & ODM** | **MongoDB & Mongoose** | Flexible document modeling for multi-attribute botanical goods, reviews, and ingredient profiles. |
| **Caching & Queues** | **Redis (via ioredis), BullMQ** | Cart stock reservation TTLs (15 min lock during checkout), order email notifications, AI rate limiting. |
| **Real-Time Layer** | **Socket.IO (Client & Server)** | Real-time dispatch notifications, live flash sales, and streaming agentic AI responses. |
| **AI / Skin Diagnostics** | **LangChain / Google Gemini SDK (gemini-1.5-flash / gemini-1.5-pro)** | Multi-agent conversational diagnostic chain for skin concern analysis and regimen generation. |
| **Payment Gateway** | **Stripe & Razorpay Mock/Live SDK** | Multi-currency, card, UPI, Apple Pay, Net Banking. |
| **Security & Validation** | **Helmet, Express-Validator, Bcryptjs, JWT** | Defense-in-depth API protection, sanitization, encrypted customer sessions. |

---

## 2. Brand Identity & Minimalist UI/UX Design System

Inspired directly by the clean aesthetic of **Minimalist** and **The Ordinary**, the UI avoids gaudy gradients, heavy drop shadows, and ornamental clutter.

### 2.1 Color Palette
* **Canvas White / Alabaster**: `#FFFFFF` / `#FAF9F6`
* **Warm Stone Neutral**: `#F3F2EE` (Used for product card tiles and contrast rows)
* **Jet Black / Primary Text**: `#111111`
* **Muted Carbon / Secondary Text**: `#666666`
* **Border & Separator Gray**: `#E5E5E5`
* **Accent Botanical Ochre / Terracotta**: `#C86D51` (Used sparingly for sale badges, low-stock warnings, and CTA highlights)
* **Status Green (Organic/Verified)**: `#2D6A4F`

### 2.2 Typography & Layout Hierarchy
* **Headings**: `Syne` or `Inter` (Geometric, crisp, letter-spacing: `-0.02em` to `-0.04em`, medium to bold weight).
* **Body & Clinical Specifications**: `Inter` / `Geist Mono` for batch dates, active concentration values (e.g., `Cold-Pressed • Shea 18% • Zinc 2%`), and pH ratings.
* **Header & Top Promo Bar**: Thin monochrome announcement strip (*"Free shipping on orders above $40 • Botanical Handcrafted Batch #2026"*), sleek fixed header with Mega-Menu dropdowns (`Shop`, `Best Sellers`, `By Concern`, `Cold-Pressed Soaps`, `Lip Care`, `Routine AI`).
* **Micro-Interactions**: Smooth 150ms ease-out transitions on button hovers, subtle image zoom on product cards, and instant slide-out right drawer for Cart and Routine AI.

---

## 3. Core Functional Modules

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Love & Co. Client (Next.js)              │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST / WebSockets
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              Express.js API Gateway Engine             │
                    ├───────────────────────────┬────────────────────────────┤
                    │   Controllers & Validations (express-validator)        │
                    │   JWT Authentication & RBAC Middleware                 │
                    └───────┬───────────────────┴───────────────────┬────────┘
                            │                                       │
            ┌───────────────▼──────────────┐         ┌──────────────▼─────────────┐
            │       Business Services      │         │    Multi-Agent AI Engine   │
            ├──────────────────────────────┤         ├────────────────────────────┤
            │  • Product & Concern Engine  │         │  • Diagnostic Agent        │
            │  • Cart & Reservation (Redis)│         │  • Formulation Matcher     │
            │  • Bundle Builder Logic      │         │  • Ingredient Safety Guard │
            │  • Order Processing & Stripe │         │  • Regimen Timeline Agent  │
            └───────────────┬──────────────┘         └──────────────┬─────────────┘
                            │                                       │
            ┌───────────────▼──────────────┐                        │
            │       Data Persistence       │                        │
            ├──────────────────────────────┤                        │
            │  • MongoDB (Primary Catalog) │◄───────────────────────┘
            │  • Redis (BullMQ & TTL locks)│
            └──────────────────────────────┘
```

### 3.1 Product Catalog & Taxonomy
* **Categorization**:
  * *Cold-Pressed Soaps*: Saponified virgin olive oil bars, goat milk & honey, French clay & tea tree, activated charcoal.
  * *Lip Care*: Botanical tinted lip balms, peptide barrier treatments, beeswax & almond lip butters.
  * *Skincare & Serums*: Squalane restorative serums, cold-pressed rosehip seed oil, niacinamide clarifying elixirs.
* **Filtering Dimensions**:
  * By Skin Concern: Acne/Blemishes, Dehydration, Hyperpigmentation, Compromised Barrier, Sensitivity.
  * By Ingredients: Cold-Pressed Squalane, Raw Shea, Vitamin E, Centella Asiatica, Lactic Acid.
  * By Formula Attributes: Fragrance-Free, Vegan, Zero Palm Oil, Cold-Processed.

### 3.2 "Build Your Own Botanical Bundle"
* Interactive multi-step selector (e.g., *Pick 1 Cleansing Bar + 1 Facial Mist + 1 Lip Balm = 15% Bundle Discount*).
* Dynamic live price calculation, auto-generated gift packaging toggle, and instant cart injection.

### 3.3 Agentic AI Routine & Ingredient Copilot ("Love Botanicals AI")
An embedded assistant accessible via floating trigger and dedicated page `/ai-consult`:
* **Skin Diagnostic Agent**: Gathers user skin type, current climate, allergens, and targets.
* **Formulation Matcher Agent**: Cross-references inventory against ingredient safety conflicts (e.g., advising against combining strong exfoliants with retinol).
* **Regimen Builder Agent**: Assembles an AM/PM minimalist regimen with step-by-step instructions.
* **Action Injection**: Emits an interactive UI card allowing single-click "Add Entire Regimen to Cart".

---

## 4. Database Collections (Mongoose Schemas)

### 4.1 `Users` Collection
```typescript
{
  _id: ObjectId,
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  skinProfile: {
    skinType: { type: String, enum: ['dry', 'oily', 'combination', 'normal', 'sensitive'] },
    concerns: [{ type: String }],
    sensitivities: [{ type: String }]
  },
  addresses: [{
    recipientName: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 `Products` Collection
```typescript
{
  _id: ObjectId,
  title: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  subtitle: { type: String }, // e.g. "Restorative Barrier Balm with 100% Cold-Pressed Shea"
  category: { type: String, enum: ['cold-pressed-soaps', 'lip-care', 'serums', 'botanical-oils', 'bundles'], required: true },
  concerns: [{ type: String, index: true }], // e.g. ['Barrier Repair', 'Dryness']
  keyActives: [{
    name: String,            // e.g. "Cold Pressed Sweet Almond Oil"
    percentage: String,      // e.g. "12%"
    purpose: String          // e.g. "Deep Lipid Replenishment"
  }],
  fullIngredientsList: { type: String, required: true },
  phLevel: { type: String }, // e.g. "5.5 - 6.0"
  curingPeriodDays: { type: Number }, // For cold-pressed soaps (e.g. 45 days)
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  inventoryStock: { type: Number, required: true, default: 0 },
  images: [{ url: String, altText: String, isPrimary: Boolean }],
  weightGrams: { type: Number },
  isFragranceFree: { type: Boolean, default: true },
  isVegan: { type: Boolean, default: true },
  batchNumber: { type: String },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdAt: Date
}
```

### 4.3 `Carts` & Stock Reservations (Redis + Mongo)
* **Cart Model** holds user/session ID, line items, chosen bundle discounts, and promo codes.
* **Redis Key**: `reservation:product:{productId}:{sessionId}` with TTL = 900 seconds (15 minutes hold on checkout step).

### 4.4 `Orders` Collection
```typescript
{
  _id: ObjectId,
  orderNumber: { type: String, unique: true },
  customerId: { type: ObjectId, ref: 'Users', required: true },
  items: [{
    productId: { type: ObjectId, ref: 'Products', required: true },
    title: String,
    quantity: Number,
    price: Number,
    variantAttributes: { type: Map, of: String }
  }],
  subtotal: Number,
  discountTotal: Number,
  shippingFee: Number,
  grandTotal: Number,
  paymentStatus: { type: String, enum: ['unpaid', 'authorized', 'captured', 'refunded'], default: 'unpaid' },
  fulfillmentStatus: { type: String, enum: ['unfulfilled', 'curing', 'packed', 'dispatched', 'delivered'], default: 'unfulfilled' },
  shippingAddress: Object,
  paymentIntentId: String,
  trackingNumber: String,
  createdAt: Date
}
```

### 4.5 `ConsultationLogs` (AI Sessions)
```typescript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'Users', index: true, nullable: true },
  sessionId: { type: String, required: true },
  diagnosedProfile: {
    skinType: String,
    primaryConcerns: [String],
    contraindications: [String]
  },
  recommendedProductIds: [{ type: ObjectId, ref: 'Products' }],
  conversationHistory: [{
    sender: { type: String, enum: ['user', 'assistant', 'system'] },
    text: String,
    actionPayload: Object,
    timestamp: Date
  }],
  createdAt: Date
}
```

---

## 5. API Contract Specifications

### 5.1 Authentication Endpoints
* `POST /api/auth/register` — Create user account with optional skin profile inputs.
* `POST /api/auth/login` — Authenticate credentials, return HTTP-only JWT cookie + sanitized user payload.
* `GET /api/auth/me` — Verify session and return profile with default addresses.
* `PUT /api/auth/skin-profile` — Update logged-in user skin preferences and sensitivities.

### 5.2 Product Catalog Endpoints
* `GET /api/products` — Retrieve paginated items with query filters:
  * `?category=cold-pressed-soaps`
  * `?concern=dryness`
  * `?vegan=true`
  * `?sort=price_asc|newest|bestselling`
* `GET /api/products/:handle` — Retrieve full product dossier including formulation breakdown, patch test guidance, and review breakdown.
* `GET /api/products/concerns/list` — Return all indexed concern categories with item counts.

### 5.3 Cart & Bundle Endpoints
* `POST /api/cart/items` — Add product to active session cart.
* `PUT /api/cart/items/:itemId` — Modify item quantity.
* `POST /api/cart/bundle` — Validate and inject custom 3-step bundle with automated 15% discount calculation.
* `POST /api/cart/reserve-stock` — Place a 15-minute atomic Redis lock for checkout initiation.

### 5.4 Order & Checkout Endpoints
* `POST /api/orders/checkout-session` — Generate Stripe/Razorpay payment intent with stock verification.
* `POST /api/orders/webhook` — Secure webhook handler for payment success, inventory reduction, and dispatch queue triggers.
* `GET /api/orders/:id` — Fetch order status, batch tracking info, and delivery tracking.

### 5.5 AI Routine Consultation Endpoints
* `POST /api/ai/diagnose` — Accepts questionnaire / conversational prompt; returns matched botanical ingredients and contraindicated items.
* `POST /api/ai/stream-chat` — Streams multi-turn consultation tokens using Gemini SDK via Server-Sent Events or WebSockets.
* `POST /api/ai/bundle-cart` — Direct translation from recommended routine into shopping cart payload.

---

## 6. Frontend Architecture & Page Specifications

The frontend implements the **Next.js Pages Router** with an uncluttered, editorial typographic layout.

```
client/src/
├── components/
│   ├── layout/
│   │   ├── AnnouncementBar.jsx       # Thin promo notification bar
│   │   ├── NavigationHeader.jsx      # Minimal sticky nav + mega dropdowns
│   │   ├── Footer.jsx                # Botanical transparency + sustainability notes
│   │   └── AppShell.jsx              # Universal page container
│   ├── common/
│   │   ├── ClinicalBadge.jsx         # % active ingredient indicator
│   │   ├── IngredientAccordion.jsx   # Clean expandable formulation details
│   │   └── ProductCard.jsx           # Minimalist tile with fast-add hover
│   ├── cart/
│   │   └── CartDrawer.jsx            # Instant side-panel cart with free shipping bar
│   ├── bundle/
│   │   └── BundleBuilder.jsx         # Custom box configurator
│   └── ai/
│       ├── RoutineAssistantModal.jsx # Clinical conversation assistant
│       └── RegimenCard.jsx           # AM/PM prescription card
├── pages/
│   ├── _app.jsx
│   ├── index.jsx                     # Hero, Best Sellers, Concern Grid, Philosophy
│   ├── shop/
│   │   ├── index.jsx                 # Full catalog with multifaceted sidebar
│   │   └── [handle].jsx              # Product deep-dive: Actives, pH, Ingredients
│   ├── concerns/
│   │   └── [concern].jsx             # Curated landing page by skin challenge
│   ├── bundle-builder.jsx            # Custom botanical kit designer
│   ├── ai-consult.jsx                # Dedicated full-page routine diagnostic
│   ├── cart.jsx
│   ├── checkout.jsx
│   ├── account/
│   │   ├── profile.jsx
│   │   └── orders.jsx
│   └── admin/
│       └── inventory.jsx             # Stock, batch numbers, & formulation updates
├── store/
│   ├── cartStore.js                  # Zustand cart & discount logic
│   ├── authStore.js                  # Zustand user session state
│   └── routineStore.js               # Diagnostic state
└── styles/
    └── globals.css                   # Custom typography & minimalist utilities
```

### 6.1 Page Layout Blueprint: Homepage (`/`)
1. **Promo Bar**: Top dark strip (`#111111`) with centered white tracking text: *"Cold-Pressed Small Batch Botanicals • Free Shipping on $40+"*.
2. **Minimal Header**: Clean brand wordmark **Love & Co.** in high-contrast serif/sans mix, horizontal navigation links (`Shop All`, `Soaps`, `Lip Balms`, `Serums`, `Build a Bundle`, `AI Routine`), search icon, account icon, and bag counter icon.
3. **Hero Section**: 60/40 Split:
   * Left: Bold, understated clinical typography (*"Cold-Pressed Purity. Zero Synthetics."*), descriptive paragraph on raw saponification, and a matte black CTA button (*"Explore Formulations"*).
   * Right: Clean studio photography of artisanal soap bars on stone blocks with ingredient callouts (*"Sweet Almond 14% • Calendula 3%"*).
4. **Curated Best Sellers Grid**: 4-column card grid with hover image swaps, active ingredient badges, price, and clean "Add to Bag" buttons.
5. **Shop by Skin Concern**: High-contrast photographic macro tiles (*Uneven Tone*, *Barrier Repair*, *Blemish Control*, *Dryness*).
6. **Ingredient Transparency Manifest**: Minimal text layout detailing saponification temps, cold-pressed extraction yield, and zero fragrance standards.
7. **Floating AI Diagnostic Widget**: Bottom-left persistent circular pill: *"Find your custom botanical regimen →"*.

---

## 7. Development Phases & Execution Protocol

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Execution Roadmap (Phased)                      │
└────────────────────────────────────────────────────────────────────────┘
  [Phase 1: Foundation]  ──► Core Setup, DB Schemas, JWT Auth & AppShell
  [Phase 2: Catalog]     ──► Products API, Filtering by Concern, PDP View
  [Phase 3: Commerce]    ──► Cart Engine, Bundle Builder, Redis TTL Lock
  [Phase 4: AI Engine]   ──► Gemini Agentic Routine Copilot & Direct Cart Push
  [Phase 5: Payments]    ──► Checkout Flow, Stripe Webhooks, Order Tracking
  [Phase 6: Hardening]   ──► Security Audits, In-Memory Dev Modes & Polish
```

* **Phase 1: Architecture Skeleton & Authentication**
  * Establish Next.js Pages router application and Express backend with Mongoose.
  * Implement in-memory fallback for local development when MongoDB is offline.
  * Build user registration, login, and JWT session persistence in Zustand.
  * Deliver `AppShell`, typography system, and responsive layout headers.

* **Phase 2: Botanical Catalog & Product Dossiers**
  * Seed database with artisanal soaps, lip balms, and natural serums.
  * Implement `/api/products` with filters for skin concerns, vegan tags, and key actives.
  * Build the Minimalist-style Product Detail Page (`[handle].jsx`) with pH indicators and raw ingredient lists.

* **Phase 3: Cart Drawer & Custom Bundle Builder**
  * Build sliding cart drawer with live subtotal, free shipping progress indicator, and promotional code engine.
  * Implement `/bundle-builder` allowing 3-product kit customization with reactive discount calculation.
  * Integrate Redis TTL stock hold preventing cart conflicts on limited-batch soaps.

* **Phase 4: Agentic AI Skin Routine Copilot**
  * Set up LangChain / Google Gemini multi-agent chain with deterministic fallback.
  * Deploy interactive diagnostic questionnaire and chat modal.
  * Implement instant cart population from AI regimen output.

* **Phase 5: Orders, Checkout & Real-Time Tracking**
  * Stripe and mock payment integration with server-side signature validation.
  * Order creation pipeline, email receipt triggers via BullMQ, and order history screens.

* **Phase 6: Hardening, Security & Visual Polish**
  * Configure Helmet, CORS policies, express-validator schemas, and rate limiters on AI routes.
  * Perform end-to-end user checkout testing and verify responsive design on all viewports.

---

## 8. Security & Engineering Guardrails

1. **Deterministic Fallbacks**: If external AI APIs (Gemini/OpenRouter) encounter network timeouts or exhausted quotas, the system must seamlessly fall back to an internal, deterministic rule-based regimen selector matching customer skin type to top-rated inventory.
2. **Thin Controllers**: Express controllers must remain strictly responsible for payload validation and response shaping. All business calculations (e.g., bundle discounts, stock allocation) must live within dedicated service classes (`services/productService.js`, `services/cartService.js`).
3. **Price Integrity**: All item prices, taxes, and bundle discounts must be recalculated and verified server-side on the database before creating payment intents. Never trust client-submitted pricing numbers.
4. **Environment Fallbacks**: Provide immediate in-memory fallbacks for both Redis and MongoDB so any developer can run and evaluate the application locally without requiring external cloud accounts.