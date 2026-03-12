const generateWhatsAppTemplate = ({ templateName, data }) => {
  //console.log("data ===> ", data);

  const templates = {
    // 🛍️ ORDER SUCCESS MESSAGE
    order_success: ({ name, orderId, amount, statusUrl, supportUrl }) => `
🎉 *Order Confirmed!*

Hi ${name || "Customer"}, thank you for shopping with us.
Your order *${orderId || "-"}* has been successfully placed.

🛍️ Total Amount: ${amount || "-"}
📦 Track your order status here: ${statusUrl || "https://yourstore.com/orders"}

Need help? Chat with our support team: ${supportUrl || "https://yourstore.com/support"
      }

Thank you for choosing us 💚
`,

    // 🛒 CART REMINDER MESSAGE
    cart_reminder: ({ name, product, days, cartUrl }) => `
🛒 *Don't forget your cart!*

Hi ${name || "there"}, the item *${product || "your favorite item"}* 
has been in your cart for ${days || "a few"} days.

🔥 Limited stock available — complete your purchase now:
${cartUrl || "https://yourstore.com/cart"}

We’ve saved your cart for you 😉
`,

    // 🚚 ORDER SHIPPED MESSAGE
    order_shipped: ({ name, orderId, trackingUrl, deliveryHelpUrl }) => `
🚚 *Your Order Has Shipped!*

Hi ${name || "Customer"}, your order *${orderId || "-"}* is on its way.  
You can track your shipment here:
${trackingUrl || "https://yourstore.com/track"}

Need delivery help? Visit: ${deliveryHelpUrl || "https://yourstore.com/help"}

Thanks for shopping with us 💚
`,

    // Default fallback
    default: () => "Hello! 👋 How can we help you today?",
  };

  const templateFn = templates[templateName] || templates.default;
  return templateFn(data || {});
};

export default generateWhatsAppTemplate;
