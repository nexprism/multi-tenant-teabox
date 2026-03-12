export class ShippingValidation {
  static validateCreateShippingRequest(body) {
    const errors = [];

    // Required fields validation
    if (!body.orderId) {
      errors.push("orderId is required");
    }

    if (!body.shipping_method) {
      errors.push("shipping_method is required");
    } else {
      const validMethods = ["dtdc", "bluedart", "blue dart"];
      if (!validMethods.includes(body.shipping_method.toLowerCase())) {
        errors.push(
          `shipping_method must be one of: ${validMethods.join(", ")}`
        );
      }
    }

    // Optional field validation
    if (body.dimensions) {
      if (typeof body.dimensions !== "object") {
        errors.push("dimensions must be an object");
      } else {
        if (
          body.dimensions.length &&
          (isNaN(body.dimensions.length) || body.dimensions.length <= 0)
        ) {
          errors.push("dimensions.length must be a positive number");
        }
        if (
          body.dimensions.width &&
          (isNaN(body.dimensions.width) || body.dimensions.width <= 0)
        ) {
          errors.push("dimensions.width must be a positive number");
        }
        if (
          body.dimensions.height &&
          (isNaN(body.dimensions.height) || body.dimensions.height <= 0)
        ) {
          errors.push("dimensions.height must be a positive number");
        }
      }
    }

    if (body.weight && (isNaN(body.weight) || body.weight <= 0)) {
      errors.push("weight must be a positive number");
    }

    // DTDC specific validation
    if (body.shipping_method && body.shipping_method.toLowerCase() === "dtdc") {
      if (body.service_type_id && typeof body.service_type_id !== "string") {
        errors.push("service_type_id must be a string for DTDC");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateOrderData(order) {
    const errors = [];

    if (!order) {
      errors.push("Order not found");
      return { isValid: false, errors };
    }

    if (!order.shipping_address) {
      errors.push("Order must have shipping address");
    } else {
      const requiredAddressFields = [
        "name",
        "address_line_1",
        "city",
        "state",
        "pincode",
      ];
      for (const field of requiredAddressFields) {
        if (!order.shipping_address[field]) {
          errors.push(`shipping_address.${field} is required`);
        }
      }

      // Validate pincode format (should be 6 digits for India)
      if (
        order.shipping_address.pincode &&
        !/^\d{6}$/.test(order.shipping_address.pincode)
      ) {
        errors.push("shipping_address.pincode must be a 6-digit number");
      }

      // Validate phone number
      if (
        order.shipping_address.phone &&
        !/^\d{10}$/.test(order.shipping_address.phone.replace(/[^\d]/g, ""))
      ) {
        errors.push("shipping_address.phone must be a valid 10-digit number");
      }
    }

    if (!order.total_amount || order.total_amount <= 0) {
      errors.push("Order must have a valid total amount");
    }

    if (!order.items || order.items.length === 0) {
      errors.push("Order must have at least one item");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEnvironmentConfig() {
    const errors = [];
    const requiredEnvVars = [
      "DTDC_API_KEY",
      "DTDC_CUSTOMER_CODE",
      "DTDC_ORIGIN_NAME",
      "DTDC_ORIGIN_PHONE",
      "DTDC_ORIGIN_ADDRESS_1",
      "DTDC_ORIGIN_PINCODE",
      "DTDC_ORIGIN_CITY",
      "DTDC_ORIGIN_STATE",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(
          `Environment variable ${envVar} is required for DTDC shipping`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
