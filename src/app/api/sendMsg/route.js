import { NextResponse } from "next/server";
import NextelWhatsapp from "@/app/lib/services/WhatsappService";

export async function POST(req) {
  try {
    // Log headers and raw body to help diagnose "undefined body" issues
    try {
      const headersObj = Object.fromEntries(req.headers?.entries?.() || []);
      console.log("/api/sendMsg headers:", headersObj);
    } catch (hErr) {
      console.log("/api/sendMsg headers (unavailable):", hErr.message || hErr);
    }

    const raw = await req.text();
    console.log("/api/sendMsg raw body:", raw);

    let body = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch (jsonErr) {
        // Could be urlencoded form or other format — try URLSearchParams
        try {
          const params = Object.fromEntries(new URLSearchParams(raw).entries());
          if (Object.keys(params).length) body = params;
        } catch (pErr) {
          console.warn(
            "Failed to parse body as JSON or URLSearchParams",
            pErr.message || pErr
          );
        }
      }
    }

    const { phone, name, email, extraFields } = body || {};
    console.log("parsed body:", { phone, name, email, extraFields });

    const whatsapp = new NextelWhatsapp();

    const response = await whatsapp.sendWebhookRequest({
      phone,
      name,
      email,
      extraFields,
    });

    console.log("response ==== > ", response);

    return NextResponse.json({ ok: true, result: response });
  } catch (err) {
    console.error("/api/sendMsg error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
