import axios from "axios";

const NEXTEL_BASE = "https://api.nextel.io/API_V2/Whatsapp";

export default class NextelWhatsapp {
  constructor() {
    this.apiKey = process.env.NEXTEL_API_KEY; // if needed
    this.sender = process.env.NEXTEL_SENDER_PHONE; // 91xxxxxxxx
    this.namespace = process.env.NEXTEL_NAMESPACE;
  }

  async sendTemplate({ to, templateId, args = [], fileName = "" }) {
    try {
      const payload = {
        type: "template",
        templateId,
        templateArgs: args,
        sender_phone: this.sender,
        file_name: fileName,
        namespace: this.namespace,
        templateLanguage: "en",
      };

      const url = `${NEXTEL_BASE}/send_template/${to}`;

      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err.message };
    }
  }

  async sendText({ to, message }) {
    try {
      const payload = {
        type: "text",
        message,
        sender_phone: this.sender,
      };

      const url = `${NEXTEL_BASE}/send_session/${to}`;

      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err.message };
    }
  }

  async sendWebhookRequest(data = {}) {
    try {
      // Expect a single object with keys: phone (required), name (required),
      // email (optional), webhookUrl (optional) and any other fields.
      const DEFAULT_WEBHOOK =
        "https://app.handlingmedia.io/WEBHOOK_V1/Audience/set/ef2ee09ea9551de88bc11fd7eeea93b0";

      if (!data || typeof data !== "object") {
        return { success: false, error: "data object is required" };
      }

      const { phone, name, email, webhookUrl, extraFields } = data;

      if (!phone) {
        return { success: false, error: "phone is required in form data" };
      }

      if (!name) {
        return { success: false, error: "name is required in form data" };
      }

      // build application/x-www-form-urlencoded body using URLSearchParams
      const form = new FormData();

      // append core fields
      form.append("phone", phone);
      form.append("name", name);
      if (email) form.append("email", email);
      // append extra fields if any
      if (extraFields && typeof extraFields === "object") {
        for (const [key, value] of Object.entries(extraFields)) {
          form.append(key, value);
        }
      }

      // log for debugging
      // FormData doesn't stringify — iterate its entries to see actual fields
      const entries = [];
      for (const [key, value] of form.entries()) {
        entries.push(`${key}=${value}`);
      }
      console.log("check form data:", entries.join(", "));

      // send URLSearchParams directly so axios sets proper content-length
      const res = await axios.post(webhookUrl || DEFAULT_WEBHOOK, form, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });
      // console.log("Webhook response:", res.data);
      return { success: true, data: res.data };
    } catch (err) {
      console.log("error in webhook call:", err.message);
      return { success: false, error: err?.response?.data || err.message };
    }
  }
}
