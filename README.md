# Love & Co. — Natural Skincare & Cold-Pressed Formulations
**Spec-Driven Development (SDD) Blueprint for Direct-to-Consumer Botanical Apothecary**  
*Design Reference Benchmarks: Be Minimalist (`beminimalist.co`), The Ordinary, Aesop*

---

## 1. Project Overview & Architecture

Love & Co. is a high-performance direct-to-consumer (D2C) web application providing cold-processed organic soaps, botanical lip elixirs, active botanical serums, and barrier repair formulations. The digital experience delivers an ultra-clean, clinical-apothecary visual aesthetic (stark monochrome accents, high-legibility grotesk typography, high-definition formulation close-ups, and clear percentage-based active ingredient callouts).

### 1.1 Multi-Agent AI Routine & Diagnostic Engine
* **Diagnostic Agent**: Categorizes customer-declared skin barrier states (Dry, Oily, Sensitive, Combination) and primary targets.
* **Formulation Matching Agent**: Queries active inventory against safety parameters and skin type compatibility.
* **Regimen Conflict Validator**: Enforces clinical contraindication rules (e.g., flag and prevent combining direct exfoliating acids like Salicylic with high-strength retinoids in the same step; splits into AM and PM protocols).
* **Direct Regimen Injection**: Injects the curated routine directly into the shopping cart with an automated 15% bundle discount.

---

## 2. Technology Stack

* **Frontend**: Next.js 15 (Pages Router), React 19, Tailwind CSS, Zustand (state persistence in `localStorage`), Axios, Lucide React icons.
* **Backend**: Node.js, Express.js, MongoDB via Mongoose (with automated embedded In-Memory fallback), Redis (via `ioredis` with in-memory TTL Map fallback), Helmet, Express-validator, Bcryptjs.
* **AI Engine**: Google Generative AI SDK (Gemini) with deterministic rule-based skin-routine fallback parser for zero-fail local development.
* **Commerce & Locks**: Redis 15-minute TTL stock hold (`reservation:product:{id}:{sessionId}`), progressive bundle discounts (10% on 2 items, 15% on 3+ items), multi-provider payment intent generation (Razorpay, Stripe, Cash on Delivery).

---

## 3. Project Directory Structure

```
love-and-co/
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # AnnouncementBar, Navbar, Footer
│   │   │   ├── home/            # HeroSlider, ShopByConcern, BundlePromoBanner, PhilosophySection
│   │   │   ├── common/          # ProductCard (clinical percentage callouts & curing badges)
│   │   │   ├── cart/            # CartDrawer (slide-over with shipping progress & bundle savings)
│   │   │   ├── ai/              # CopilotWidget, RoutineAssistantModal
│   │   │   └── bundle/          # Bundle configurators
│   │   ├── pages/
│   │   │   ├── _app.jsx         # Universal AppShell & global stores
│   │   │   ├── _document.jsx    # Fonts & metadata
│   │   │   ├── index.jsx        # Homepage with bestsellers & philosophy
│   │   │   ├── catalog.jsx      # Multifaceted filtering by concern, category, skin type
│   │   │   ├── product/[slug].jsx # Product detail page with INCI accordion & AM/PM routine
│   │   │   ├── bundle-builder.jsx # 3-step interactive kit configurator with tiered discount
│   │   │   ├── checkout.jsx     # Encrypted checkout with Redis stock hold
│   │   │   ├── orders/[id].jsx  # Visual chronological order tracking timeline
│   │   │   ├── login.jsx        # Email/password & phone OTP authentication
│   │   │   ├── register.jsx     # Onboarding with skin barrier profiling
│   │   │   ├── account/profile.jsx # User profile & order history
│   │   │   ├── admin/inventory.jsx # Merchant small-batch stock control
│   │   │   └── ai-consult.jsx   # Dedicated AI consultation landing page
│   │   ├── store/
│   │   │   ├── cartStore.js     # Persistent cart & tiered bundle discount logic
│   │   │   ├── authStore.js     # JWT session & skin profile state
│   │   │   └── copilotStore.js  # Diagnostic questionnaire & AI chat state
│   │   └── styles/
│   │       └── globals.css      # Clinical typography & monochrome theme
├── server/
│   ├── src/
│   │   ├── config/              # MongoDB connection & Redis TTL lock fallback
│   │   ├── controllers/         # Auth, Product, Cart, Order, and AI controllers
│   │   ├── models/              # User, Product, Order, ConsultationSession
│   │   ├── routes/              # Express route definitions mounted on /api and /api/v1
│   │   ├── services/            # GeminiRoutineService, InventoryLockService, PaymentService, BundleService
│   │   ├── data/                # Seed botanical catalog (10 clinical formulations)
│   │   └── server.js            # Express gateway & Socket.IO server
└── README.md
```

---

## 4. Getting Started

### 4.1 Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### 4.2 Starting the Backend Server
```bash
cd server
npm run dev
```
* The API boots up on `http://localhost:5000`
* **Zero external dependencies required**: If `MONGODB_URI` is not provided, an embedded in-memory MongoDB instance automatically boots up and seeds the botanical catalog with 10 formulations and demo credentials!
* Redis runs automatically with an in-memory TTL map fallback if an external Redis instance is not active.

### 4.3 Starting the Frontend Client
```bash
cd client
npm run dev
```
* The Next.js client boots up on `http://localhost:3000`

---

## 5. Demo Credentials

* **Customer Account**: `client@loveandco.com` / `Password123!`
* **Admin Account**: `admin@loveandco.com` / `AdminPassword123!`
* **Phone OTP Test Code**: `123456`
* **Promotional Code**: `BOTANICAL15` (15% discount)

---

## 6. Key API Contracts

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/products` | `GET` | Paginated catalog with category, concern, and skinType filters |
| `/api/v1/products/:slug` | `GET` | Full formulation dossier with INCI list, curing days, and pH |
| `/api/v1/products/curated/bestsellers` | `GET` | Top-rated formulations with review metrics |
| `/api/v1/cart/validate-bundle` | `POST` | Validates custom bundle and returns tiered savings (10% on 2, 15% on 3+) |
| `/api/v1/cart/reserve-stock` | `POST` | Places 15-minute Redis TTL hold on batch inventory |
| `/api/v1/orders/checkout` | `POST` | Server-side price recalculation, order creation, and payment intent |
| `/api/v1/orders/:id` | `GET` | Chronological order fulfillment timeline and details |
| `/api/v1/ai/consultation/message` | `POST` | Multi-agent diagnostic evaluation and AM/PM regimen generation |
| `/api/v1/ai/consultation/regimen-to-cart` | `POST` | Direct translation from recommended routine into cart bundle |
