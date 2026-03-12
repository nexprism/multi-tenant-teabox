import FrequentlyPurchasedProductRepository from "../repository/FrequentlyPurchasedProductRepository.js";

export default class FrequentlyPurchasedProductService {
  constructor(connection) {
    this.repository = new FrequentlyPurchasedProductRepository(connection);
  }

  async addProduct(data, conn) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      throw new Error(`Failed to add frequently purchased product: ${error.message}`);
    }
  }

  async getFrequentlyPurchased(conn, limit = 10) {
    try {
      // Get admin-added products
      const adminAdded = await this.repository.getAll();
      const adminProductIds = adminAdded.map(item => item.productId.toString());

      // Get frequently purchased products from orders
      const orderBased = await this.repository.getFrequentlyPurchasedFromOrders(conn, limit);

      // Filter out order-based products that are already admin-added
      const filteredOrderBased = orderBased.filter(
        item => !adminProductIds.includes(item.productId.toString())
      );

      // Combine admin-added (priority first) and order-based products
      const combined = [
        ...adminAdded.map(item => ({
          product: item.productId,
          source: "admin",
          priority: item.priority,
          count: null,
        })),
        ...filteredOrderBased.map(item => ({
          product: item.product,
          source: "order",
          priority: 0,
          count: item.count,
        })),
      ];

      // Sort: admin-added by priority, then order-based by count
      const sorted = combined.sort((a, b) => {
        if (a.source === "admin" && b.source === "admin") {
          return b.priority - a.priority; // Higher priority first
        }
        if (a.source === "admin") return -1; // Admin-added first
        if (b.source === "admin") return 1;
        return b.count - a.count; // Higher count first
      });

      // Limit the result
      return sorted.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to fetch frequently purchased products: ${error.message}`);
    }
  }
}