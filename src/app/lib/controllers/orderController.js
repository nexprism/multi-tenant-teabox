import OrderService from "../services/orderService.js";
import multer from "multer"; // Already in dependencies

class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  //createBulkShipment
  async createBulkShipment(req, conn, tenant) {
    //consolle.log("Controller received create bulk shipment data:", req.body);
    //consolle.log("Controller tenant:", tenant);
    try {
      const result = await this.orderService.createBulkShipment(req.body, conn, tenant);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async create(req, conn, tenant) {
    //consolle.log("Controller received create order data:", req.body);
    //consolle.log("Controller tenant:", tenant);
    try {
      const result = await this.orderService.createOrder(
        req.body,
        conn,
        tenant
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async check(req, conn, tenant) {
    //consolle.log("Controller tenant:", tenant);
    //consolle.log("Controller received check order data:", req.body);
    try {
      const result = await this.orderService.checkOrder(req.body, conn, tenant);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getUserOrders(request, conn) {
    //consolle.log("Controller received get user orders request");
    try {
      const result = await this.orderService.getUserOrders(request, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getOrderDetails(request, conn, params) {
    // //consolle.log(
    //   "Controller received get order details request for orderId:",
    //   params.id
    // );
    try {
      const result = await this.orderService.getOrderDetails(
        request,
        conn,
        params
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getAllOrders(request, conn, filters = {}) {
    try {
      // Build filter conditions
      const filterConditions = {};
      if (filters.status) {
        filterConditions.status = filters.status;
      }

      if (filters.bookedParam) {
        if (filters.bookedParam === "true") {
          filterConditions.isShipmentBooked = true;
        } else if (filters.bookedParam === "false") {
          // Match documents where isShipmentBooked is false OR the field doesn't exist
          filterConditions.$or = [
        { isShipmentBooked: false },
        { isShipmentBooked: { $exists: false } },
          ];
        }
      }

      // Parse pagination and sorting
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const sortConditions = filters.sortBy || { createdAt: -1 };

      // Call repository method directly with all parameters
      const { results, totalCount, currentPage, pageSize } =
        await this.orderService.orderRepository.getAllOrders(
          filterConditions,
          sortConditions,
          page,
          limit,
          ["items.product", "items.variant", "coupon", "user"],
          {}
        );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        message: "All orders fetched successfully",
        data: results,
        currentPage,
        totalPages,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  //serviceList

  async serviceList({ body }, conn, tenant) {
    //consolle.log("Controller received service list request with body:", body);
    const { orderId } = body;

    // Fetch order from DB
    const orderResp = await this.orderService.getOrderById(orderId, null, ["items.product"]);
    //console.log("Order fetched in controller:", orderResp);
    if (!orderResp || !orderResp.success) return { success: false, message: "Order not found" };
    
    const services = await this.orderService.getServiceOptions(orderResp, conn);

    return { success: true, orderId, services };
  }

  async createShipment({ body }) {
    const { orderId, courier, serviceCode } = body;

    if (!orderId || !courier || !serviceCode)
      return { success: false, message: "Missing data (" + (orderId ? "" : "orderId ") + (courier ? "" : "courier ") + (serviceCode ? "" : "serviceCode") + ")" };

    const orderResp = await this.orderService.getOrderById(orderId, null, ["items.product"]);
    if (!orderResp || !orderResp.success) return { success: false, message: orderResp?.message || "Order not found for shipment" };

    const shipmentResp = await this.orderService.createShipment(
      orderResp.data,
      courier,
      serviceCode
    );

    return {
      success: shipmentResp.success,
      message: shipmentResp.message,
      orderId,
      courier,
      response: shipmentResp.data || shipmentResp.error,
    };
  }

  // cancelShipment
  async cancelShipment({ body }, conn, tenant) {
    const { orderId, courier } = body;

    if (!courier) return { success: false, message: "Missing data (courier)" };

    let order = null;
    if (orderId) {
      const orderResp = await this.orderService.getOrderById(orderId, null, ["items.product"]);
      if (!orderResp || !orderResp.success) return { success: false, message: orderResp?.message || "Order not found for shipment cancel" };
      order = orderResp.data;
    }

    const cancelResp = await this.orderService.cancelShipment(order, courier, body, conn);

    return {
      success: cancelResp.success,
      message: cancelResp.message,
      orderId: orderId || null,
      courier,
      response: cancelResp.data || cancelResp.error,
    };
  }

  //generateLabel
  async generateLabel({ body }) {
    const { orderId, courier } = body;

    if (courier === "dtdc") {
      if (!body.labelCode) {
        return { success: false, message: "Missing label code" };
      }
    }

    if (!orderId || !courier)
      return { success: false, message: "Missing data" };

    const order = await this.orderService.getOrderById(orderId);
    // //consolle.log("Order fetched in controller for label generation:", order);
    if (!order) return { success: false, message: "Order not found" };

    const labelResp = await this.orderService.generateLabel(
      order.data,
      courier,
      body
    );
    return {
      success: true,
      orderId,
      courier,
      response: labelResp,
    };
  }

  //trackShipment
  async trackShipment(req, conn, tenant) {
    try {
      //fetch all orders for tracking
      const orders = await this.orderService.getAllOrdersForTracking(
        req,
        conn,
        tenant
      );
      // //consolle.log("Orders fetched for tracking:", orders);

      if (!orders.data || orders.data.length === 0) {
        return { success: false, message: "No orders found for tracking" };
      }

      for (const orderRecord of orders.data) {
        const orderId = orderRecord._id;
        // //consolle.log("Processing order for tracking:", orderId);
        if (!orderRecord || !orderRecord.shipping_details) {
          ////consolle.log(`No shipping details for Order ID: ${orderId}, skipping...`);
          continue;
        }
        const trackingNumber = orderRecord.shipping_details.reference_number;
        //consolle.log(`Processing tracking for Order ID: ${orderId}, Tracking Number: ${trackingNumber}`);
        if (orderId && trackingNumber) {
          //consolle.log(`Tracking shipment for Order ID: ${orderId}, Tracking Number: ${trackingNumber}`);
          const order = await this.orderService.getOrderById(orderId);
          if (!order) return { success: false, message: "Order not found" };
          await this.orderService.trackShipment(
            order.data,
            trackingNumber,
            conn
          );

          //consolle.log(`Tracking updated for Order ID: ${orderId}`);
        }

        //consolle.log(`Missing orderId or trackingNumber for Order ID: ${orderId}, skipping...`);
        continue;
      }
      return {
        success: true,
        message: "Shipment tracking completed for all orders",
        data: orders.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
  //cancelOrder
  async cancelOrder(request, conn, params) {
    try {
      const { id } = await params;
      const userId = request.user?._id;

      if (!id) return { success: false, message: "Order ID is required" };

      const result = await this.orderService.cancelOrder(id, userId, conn);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }


  //getShipmentDashboard
  async getShipmentDashboard(req, conn, tenant) {
    try {
      // Extract optional query params (platform, from, to)
      let filters = {};
      try {
        const url = req.nextUrl || (req.url ? new URL(req.url) : null);
        const searchParams = url ? url.searchParams : null;
        if (searchParams) {
          const platform = searchParams.get("platform");
          const from = searchParams.get("from");
          const to = searchParams.get("to");
          if (platform) filters.platform = platform;
          if (from) filters.from = from;
          if (to) filters.to = to;
        }
      } catch (e) {
        // ignore parsing errors and continue with empty filters
      }

      const dashboardData = await this.orderService.getShipmentDashboardData(conn, filters);
      return { success: true, data: dashboardData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // New method: Export orders to Excel
  async exportOrders(request, conn) {
    try {
      const searchParams = request.nextUrl?.searchParams;
      const filters = searchParams?.get("filters")
        ? JSON.parse(searchParams.get("filters"))
        : { status: "pending" };

      const result = await this.orderService.exportOrdersToExcel(filters, conn);
      if (!result.success) {
        return { success: false, message: result.message };
      }

      // Return file as response (in Next.js, you'd set headers for download)
      return {
        success: true,
        message: result.message,
        data: result.data, // Buffer
        filename: result.filename,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // New method: Confirm orders from Excel upload
  async confirmOrders(request, conn) {
    try {
      // Use memory storage so request.file.buffer is populated
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
      }); // 10MB

      // Note: actual middleware invocation must happen in route layer.
      // Here controller expects request.file to already be populated.
      if (!request.file || !request.file.buffer) {
        return { success: false, message: "No file uploaded or middleware not applied (expect form-data with field 'excelFile')" };
      }

      const result = await this.orderService.confirmOrdersFromExcel(request.file.buffer, conn);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  // New method: Upload manual orders from Excel
  async uploadManualOrders(request, conn, tenant) {
    try {
      // Use memory storage so request.file.buffer is populated
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
      }); // 10MB

      if (!request.file || !request.file.buffer) {
        return { success: false, message: "No file uploaded or middleware not applied (expect form-data with field 'excelFile')" };
      }

      const result = await this.orderService.createManualOrdersFromExcel(request.file.buffer, conn, tenant);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async update(request, conn, params) {
    try {
      const { id } = await params;
      const data = await request.json();
      const result = await this.orderService.updateOrder(id, data);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}

export default OrderController;
