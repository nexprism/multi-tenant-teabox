export class DTDCShippingService {
  constructor() {
    this.apiUrl =
      "https://alphademodashboardapi.shipsy.io/api/customer/integration/consignment/softdata";
    this.apiKey = process.env.DTDC_API_KEY; // You'll need to set this in your environment
  }

  async createShipment(orderData, shippingDetails) {
    try {
      console.log("[DTDCShippingService] createShipment called", {
        orderId: orderData?._id || orderData?.order_id || orderData?.customer_reference_number,
        items: Array.isArray(orderData?.items) ? orderData.items.length : undefined,
      });
      const consignmentData = this.formatConsignmentData(
        orderData,
        shippingDetails
      );

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consignments: [consignmentData],
        }),
      });

      const result = await response.json();
      console.log("[DTDCShippingService] provider response status", response.status);
      console.log("[DTDCShippingService] provider response summary", {
        ok: response.ok,
        message: result?.message,
      });

      if (!response.ok) {
        throw new Error(`DTDC API Error: ${result.message || "Unknown error"}`);
      }

      return {
        success: true,
        data: result,
        trackingNumber: result.consignments?.[0]?.tracking_number || null,
      };
    } catch (error) {
      console.error("[DTDCShippingService] error", error?.stack || error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  formatConsignmentData(orderData, shippingDetails) {
    return {
      customer_code: process.env.DTDC_CUSTOMER_CODE || "<Customer Code>",
      service_type_id: shippingDetails.service_type_id || "B2C PRIORITY",
      load_type: "NON-DOCUMENT",
      description:
        orderData.items
          ?.map((item) => item.description || item.name)
          .join(", ") || "Order Items",
      dimension_unit: "cm",
      length: shippingDetails.dimensions?.length?.toString() || "10.0",
      width: shippingDetails.dimensions?.width?.toString() || "10.0",
      height: shippingDetails.dimensions?.height?.toString() || "10.0",
      weight_unit: "kg",
      weight: shippingDetails.weight?.toString() || "1.0",
      declared_value: orderData.total_amount?.toString() || "0",
      num_pieces: orderData.items?.length?.toString() || "1",
      origin_details: {
        name: process.env.DTDC_ORIGIN_NAME || "Your Store Name",
        phone: process.env.DTDC_ORIGIN_PHONE || "9999999999",
        alternate_phone: "",
        address_line_1:
          process.env.DTDC_ORIGIN_ADDRESS_1 || "Store Address Line 1",
        address_line_2: process.env.DTDC_ORIGIN_ADDRESS_2 || "",
        pincode: process.env.DTDC_ORIGIN_PINCODE || "110001",
        city: process.env.DTDC_ORIGIN_CITY || "New Delhi",
        state: process.env.DTDC_ORIGIN_STATE || "Delhi",
      },
      destination_details: {
        name:
          orderData.shipping_address?.name ||
          orderData.customer_name ||
          "Customer",
        phone:
          orderData.shipping_address?.phone || orderData.customer_phone || "",
        alternate_phone: orderData.shipping_address?.alternate_phone || "",
        address_line_1: orderData.shipping_address?.address_line_1 || "",
        address_line_2: orderData.shipping_address?.address_line_2 || "",
        pincode: orderData.shipping_address?.pincode || "",
        city: orderData.shipping_address?.city || "",
        state: orderData.shipping_address?.state || "",
      },
      customer_reference_number: orderData.order_id || `ORDER-${Date.now()}`,
      cod_collection_mode: orderData.payment_method === "cod" ? "cash" : "",
      cod_amount:
        orderData.payment_method === "cod"
          ? orderData.total_amount?.toString()
          : "0",
      commodity_id: "7", // Default commodity ID, you might want to make this configurable
      reference_number: "",
      pieces_detail: orderData.items?.map((item) => ({
        description: item.description || item.name || "Product",
        declared_value: item.price?.toString() || "0",
        weight: item.weight?.toString() || "0.5",
        height: item.dimensions?.height?.toString() || "5",
        length: item.dimensions?.length?.toString() || "5",
        width: item.dimensions?.width?.toString() || "5",
      })) || [
        {
          description: "Order Item",
          declared_value: "100",
          weight: "0.5",
          height: "5",
          length: "5",
          width: "5",
        },
      ],
    };
  }
}

export class BlueDartShippingService {
  constructor() {
    // Placeholder for Blue Dart integration
    this.apiUrl = process.env.BLUEDART_API_URL;
    this.apiKey = process.env.BLUEDART_API_KEY;
  }

  async createShipment(orderData, shippingDetails) {
    console.log("[BlueDartShippingService] createShipment called", {
      orderId: orderData?._id || orderData?.order_id,
      items: Array.isArray(orderData?.items) ? orderData.items.length : undefined,
    });

    // Placeholder implementation — keep behavior explicit for callers
    console.warn("[BlueDartShippingService] createShipment not implemented");
    return {
      success: false,
      error: "Blue Dart integration not implemented",
    };
  }
}
