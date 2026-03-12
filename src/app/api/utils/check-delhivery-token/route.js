import { NextResponse } from "next/server";
import axios from "axios";

function short(v) {
  if (v === undefined || v === null) return null;
  try {
    if (typeof v === "object") return JSON.stringify(v).slice(0, 500);
    return String(v).slice(0, 500);
  } catch (e) {
    return String(v).slice(0, 500);
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || process.env.DELHIVERY_API_TOKEN;
  const pin = url.searchParams.get("pin") || "110001";

  const clientName = url.searchParams.get("client") || process.env.DELHIVERY_CLIENT_NAME || "TESTBENCH";

  const masked = token ? `${token.slice(0, 4)}...${token.slice(-4)}` : null;

  const attempts = {};

  // Attempt 1: query-param waybill
  try {
    const waybillUrl = `https://track.delhivery.com/waybill/api/bulk/json/?token=${token}&cl=${encodeURIComponent(clientName)}&count=1`;
    const r = await axios.get(waybillUrl, { timeout: 8000 });
    attempts.queryWaybill = { ok: true, status: r.status, data: short(r.data) };
  } catch (err) {
    attempts.queryWaybill = { ok: false, status: err.response?.status || null, error: short(err.response?.data || err.message) };
  }

  // Attempt 2: header auth waybill
  try {
    const waybillUrlNoToken = `https://track.delhivery.com/waybill/api/bulk/json/?cl=${encodeURIComponent(clientName)}&count=1`;
    const r2 = await axios.get(waybillUrlNoToken, {
      headers: { Authorization: `Token ${token}` },
      timeout: 8000,
    });
    attempts.headerWaybill = { ok: true, status: r2.status, data: short(r2.data) };
  } catch (err) {
    attempts.headerWaybill = { ok: false, status: err.response?.status || null, error: short(err.response?.data || err.message) };
  }

  // Attempt 3: serviceability (pin)
  try {
    const svcUrl = `https://track.delhivery.com/c/api/pin-codes/json/?token=${token}&filter_codes=${encodeURIComponent(pin)}`;
    const r3 = await axios.get(svcUrl, { timeout: 8000 });
    attempts.serviceability = { ok: true, status: r3.status, data: short(r3.data) };
  } catch (err) {
    attempts.serviceability = { ok: false, status: err.response?.status || null, error: short(err.response?.data || err.message) };
  }

  return NextResponse.json({ tokenPresent: !!token, token: masked, pin, attempts }, { status: 200 });
}

export async function POST(req) {
  return GET(req);
}
