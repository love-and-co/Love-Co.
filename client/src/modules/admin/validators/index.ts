/**
 * Production Data Validators for Skincare D2C Products, Batches & Orders
 * Standardized typed validation results with structured field errors.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export const ProductValidator = {
  validate(data: any): ValidationResult<any> {
    const errors: Record<string, string> = {};

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.title = 'Title is required (minimum 3 characters)';
    }

    if (!data.category) {
      errors.category = 'Category is required';
    }

    if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0) {
      errors.price = 'Valid retail price (₹) is required';
    }

    if (data.costPrice === undefined || isNaN(Number(data.costPrice)) || Number(data.costPrice) < 0) {
      errors.costPrice = 'Valid unit cost price (₹) is required for margin calculation';
    }

    const validGst = [0, 5, 12, 18];
    if (data.gstRate === undefined || !validGst.includes(Number(data.gstRate))) {
      errors.gstRate = 'GST rate must be 0%, 5%, 12%, or 18%';
    }

    if (!data.routineStep) {
      errors.routineStep = 'Skincare routine step is required (Cleanse, Treat, Moisturize, Sunscreen)';
    }

    if (!data.skinConcerns || !Array.isArray(data.skinConcerns) || data.skinConcerns.length === 0) {
      errors.skinConcerns = 'Select at least one targeted skin concern';
    }

    if (!data.skinTypes || !Array.isArray(data.skinTypes) || data.skinTypes.length === 0) {
      errors.skinTypes = 'Select at least one compatible skin type';
    }

    return {
      success: Object.keys(errors).length === 0,
      data: Object.keys(errors).length === 0 ? data : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  },
};

export const BatchValidator = {
  validate(data: any): ValidationResult<any> {
    const errors: Record<string, string> = {};

    if (!data.batchNumber || typeof data.batchNumber !== 'string' || data.batchNumber.trim().length < 3) {
      errors.batchNumber = 'Batch code is required (e.g., BATCH-2026-091)';
    }

    if (!data.mfgDate) {
      errors.mfgDate = 'Manufacturing Date (MFG) is required';
    }

    if (!data.expDate) {
      errors.expDate = 'Expiry Date (EXP) is required';
    }

    if (data.mfgDate && data.expDate) {
      const mfg = new Date(data.mfgDate).getTime();
      const exp = new Date(data.expDate).getTime();
      if (exp <= mfg) {
        errors.expDate = 'Expiry Date must be later than Manufacturing Date';
      }
    }

    if (data.stockQuantity === undefined || isNaN(Number(data.stockQuantity)) || Number(data.stockQuantity) < 1) {
      errors.stockQuantity = 'Stock units must be greater than zero';
    }

    return {
      success: Object.keys(errors).length === 0,
      data: Object.keys(errors).length === 0 ? data : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  },
};

export const OrderFulfillmentValidator = {
  validate(data: any): ValidationResult<any> {
    const errors: Record<string, string> = {};

    if (!data.courier || data.courier.trim().length === 0) {
      errors.courier = 'Courier partner is required (e.g., Bluedart Express, Delhivery Air)';
    }

    if (!data.awbNumber || data.awbNumber.trim().length < 6) {
      errors.awbNumber = 'Valid AWB tracking code is required (minimum 6 alphanumeric chars)';
    }

    return {
      success: Object.keys(errors).length === 0,
      data: Object.keys(errors).length === 0 ? data : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  },
};

export const SkinQuizRuleValidator = {
  validate(data: any): ValidationResult<any> {
    const errors: Record<string, string> = {};

    if (!data.concern) errors.concern = 'Primary skin concern is required';
    if (!data.skinType) errors.skinType = 'Primary skin type is required';
    if (!data.recommendedRoutine?.am || data.recommendedRoutine.am.length === 0) {
      errors.amRoutine = 'Select at least one product for the AM routine';
    }
    if (!data.recommendedRoutine?.pm || data.recommendedRoutine.pm.length === 0) {
      errors.pmRoutine = 'Select at least one product for the PM routine';
    }

    return {
      success: Object.keys(errors).length === 0,
      data: Object.keys(errors).length === 0 ? data : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  },
};

