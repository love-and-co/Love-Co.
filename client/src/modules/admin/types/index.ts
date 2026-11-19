/**
 * Science-Backed D2C Skincare & Personal Care Admin Portal
 * Core TypeScript Interfaces & Data Contracts
 * Modeled after Be Minimalist / The Ordinary formulation & operations standards.
 */

export type Role = 'super_admin' | 'warehouse_ops' | 'support';

export type GstRate = 0 | 5 | 12 | 18;

export type RoutineStep = 'Cleanse' | 'Treat' | 'Moisturize' | 'Sunscreen';

export type UsageTime = 'AM' | 'PM' | 'Both';

export type SkinConcern =
  | 'Acne'
  | 'Pigmentation'
  | 'Aging'
  | 'Barrier Repair'
  | 'Oil Control'
  | 'Dryness & Dehydration'
  | 'Redness & Sensitivity'
  | 'Enlarged Pores';

export type SkinType = 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal';

export interface ActiveIngredient {
  name: string;
  percentage: string;
  function: string;
}

export interface ProductBatch {
  batchNumber: string;
  mfgDate: string; // ISO date string
  expDate: string; // ISO date string
  stockQuantity: number;
  reservedQuantity: number;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  costPrice: number;
  gstRate: GstRate;
  category: 'Serums' | 'Cleansers' | 'Moisturizers' | 'Sunscreens' | 'Toners' | 'Bundles';
  collections?: string[];
  isActive: boolean;

  // Skincare Formulation Metadata
  activeIngredients: ActiveIngredient[];
  skinConcerns: SkinConcern[];
  skinTypes: SkinType[];
  routineStep: RoutineStep;
  usageTime: UsageTime;
  contraindications: string[]; // e.g., ['Retinol', 'Direct Acids', 'Pure Vitamin C']
  phLevel?: string | number;

  // Batch & FEFO Inventory
  batches: ProductBatch[];
  totalStock: number;
  lowStockThreshold: number;

  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMode = 'PREPAID' | 'COD';
export type PaymentGateway = 'Razorpay' | 'Cashfree';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export type ShippingStatus =
  | 'UNFULFILLED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RTO'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  title: string;
  batchNumber?: string;
  quantity: number;
  price: number;
  gstRate: GstRate;
}

export interface Order {
  _id: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
  };
  items: OrderItem[];
  payment: {
    mode: PaymentMode;
    gateway: PaymentGateway;
    status: PaymentStatus;
    transactionId?: string;
  };
  shipping: {
    courier: string;
    awbNumber?: string;
    trackingUrl?: string;
    status: ShippingStatus;
    dispatchedAt?: string;
    deliveredAt?: string;
  };
  pricingBreakdown: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    taxAmount: number;
    totalAmount: number;
  };
  isRtoRisk?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkinQuizRule {
  _id: string;
  concern: SkinConcern;
  skinType: SkinType;
  recommendedProductIds: string[];
  recommendedRoutine: {
    am: string[]; // Product IDs
    pm: string[]; // Product IDs
  };
  adviceHeadline?: string;
  activeContraindicationWarnings?: string[];
}

export interface BatchWatchlistItem {
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  unitsLeft: number;
  daysRemaining: number;
  status: 'SAFE' | 'EXPIRING_SOON' | 'EXPIRED';
  actionableLossValue: number;
}

