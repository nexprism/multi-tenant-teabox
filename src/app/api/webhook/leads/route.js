import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSubdomain, getDbConnection } from '@/app/lib/tenantDb.js';
import { createLeadService } from '@/app/lib/services/leadService.js';

const VERIFY_TOKEN = "bharatLeadToken";
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "EAAO4LKbXZBCcBQJS7Tayc0ZBZCYv5ZAdtVZBtcPtpvoaOiUKo3hwbpYmcP83ZBtHWd1OAZBWQkKgILlOn9m42QhWVFvyIsbe3ZCZChxcFZBl7TWmcPuKf7iCkAIcCUp4Ybf3aVGZBmSq1FR1SEKWg7G8C1VZCC7D8xkgZC6vzXffqjjfgbvWNno7vtgnxCdZCQPzkgn5yCvGgZBZAxQEbEtYyUV26jR0jNADYTkqM2nmPCobHZAEZD";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook Verified Successfully!");
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse("Forbidden", { status: 403 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log("Lead Payload Received:", JSON.stringify(body, null, 2));

        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const leadgen_id = change?.value?.leadgen_id;

        if (!leadgen_id) {
            return NextResponse.json({ message: "No leadgen_id found" }, { status: 200 });
        }

        // Fetch full lead details
        const leadDetails = await axios.get(
            `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${PAGE_ACCESS_TOKEN}`
        );

        console.log("Full Lead Data:", JSON.stringify(leadDetails.data, null, 2));

        // Connect to DB
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            console.error("No DB connection for subdomain:", subdomain);
            return NextResponse.json({ message: "DB connection failed" }, { status: 500 });
        }

        // Map Facebook data to Lead model
        // Facebook usually returns field_data: [{ name: "email", values: ["..."] }, ...]
        const fieldData = leadDetails.data.field_data || [];
        const leadData = {
            source: 'facebook_lead_ads',
            status: 'new',
            fullName: getField(fieldData, 'full_name') || getField(fieldData, 'name'),
            email: getField(fieldData, 'email'),
            phone: getField(fieldData, 'phone_number') || getField(fieldData, 'phone'),
            // Add other fields as needed
            notes: [{ note: `Imported from Facebook Lead Ads. Lead ID: ${leadgen_id}` }]
        };

        // Save to DB
        await createLeadService(leadData, conn);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error("Error fetching/saving lead:", err.response?.data || err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

function getField(fieldData, name) {
    const field = fieldData.find(f => f.name === name);
    return field?.values?.[0];
}
