const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const EmailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  from: { type: String, required: true, default: 'no-reply@teabox.com' },
  content: { type: String, required: true }
}, { timestamps: true });

async function seedEmailTemplates() {
  const dbUri = process.argv[2] || process.env.MONGODB_URI;
  if (!dbUri) {
    console.error("MONGODB_URI not provided in .env or as CLI argument");
    process.exit(1);
  }

  try {
    const conn = await mongoose.createConnection(dbUri).asPromise();
    console.log("Connected to database for email template seeding.");

    const EmailTemplate = conn.models.EmailTemplate || conn.model("EmailTemplate", EmailTemplateSchema);

    const templates = [
      {
        name: "Order Created",
        subject: "Order Confirmation - {order_id}",
        from: "Teabox <orders@teabox.com>",
        content: `
          <h1>Hi {customer_name},</h1>
          <p>Thank you for your order! Your order <strong>#{order_id}</strong> has been successfully placed on {order_date}.</p>
          <p>Total Amount: ₹{total_amount}</p>
          <p>Tracking Details: {tracking_id} ({tracking_url})</p>
          <p>View your order here: <a href="{order_url}">{order_url}</a></p>
          <p>Regards,<br/>Teabox Team</p>
        `
      },
      {
        name: "Order Created For Owner",
        subject: "New Order Received - {order_id}",
        from: "System <system@teabox.com>",
        content: `
          <h1>New Order Alert!</h1>
          <p>A new order has been placed on {order_date}.</p>
          <p>Order ID: {order_id}</p>
          <p>Customer: {customer_name}</p>
          <p>Amount: ₹{total_amount}</p>
          <p>Shiprocket ID: {tracking_id}</p>
          <p>Go to Admin Dashboard to manage this order.</p>
        `
      }
    ];

    for (const t of templates) {
      await EmailTemplate.findOneAndUpdate(
        { name: t.name },
        t,
        { upsert: true, new: true }
      );
      console.log(`Updated/Created template: ${t.name}`);
    }

    await conn.close();
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

seedEmailTemplates();
