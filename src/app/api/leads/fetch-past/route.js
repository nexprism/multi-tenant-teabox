import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSubdomain, getDbConnection } from '@/app/lib/tenantDb.js';
import { createLeadService } from '@/app/lib/services/leadService.js';
import leadSchema from '@/app/lib/models/Lead.js';

const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "EAAO4LKbXZBCcBQJS7Tayc0ZBZCYv5ZAdtVZBtcPtpvoaOiUKo3hwbpYmcP83ZBtHWd1OAZBWQkKgILlOn9m42QhWVFvyIsbe3ZCZChxcFZBl7TWmcPuKf7iCkAIcCUp4Ybf3aVGZBmSq1FR1SEKWg7G8C1VZCC7D8xkgZC6vzXffqjjfgbvWNno7vtgnxCdZCQPzkgn5yCvGgZBZAxQEbEtYyUV26jR0jNADYTkqM2nmPCobHZAEZD";

export async function GET(request) {
    try {
        // Connect to DB
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            return NextResponse.json({ message: "DB connection failed" }, { status: 500 });
        }

        // 1. Fetch all Lead Gen Forms for the Page (with pagination)
        let forms = [];
        let formsUrl = `https://graph.facebook.com/v19.0/me/leadgen_forms?access_token=${PAGE_ACCESS_TOKEN}&limit=100`;

        while (formsUrl) {
            const formsResponse = await axios.get(formsUrl);
            forms = forms.concat(formsResponse.data.data);
            formsUrl = formsResponse.data.paging?.next;
        }

        let totalLeadsImported = 0;
        let errors = [];

        console.log(`Found ${forms.length} forms.`);

        // 2. Iterate through each form and fetch leads (with pagination)
        for (const form of forms) {
            try {
                let leadsUrl = `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${PAGE_ACCESS_TOKEN}&limit=100`;

                while (leadsUrl) {
                    const leadsResponse = await axios.get(leadsUrl);
                    const leads = leadsResponse.data.data;
                    console.log(`Found ${leads.length} leads in batch for form ${form.name} (${form.id})`);

                    for (const lead of leads) {
                        try {
                            const fieldData = lead.field_data || [];
                            const email = getField(fieldData, 'email');
                            const phone = getField(fieldData, 'phone_number') || getField(fieldData, 'phone');
                            const fullName = getField(fieldData, 'full_name') || getField(fieldData, 'name');

                            // Check if lead already exists by email
                            const LeadModel = conn.models['Lead'] || conn.model('Lead', leadSchema);

                            // If email is missing, try to check by phone, or skip if both missing
                            let existingLead = null;
                            if (email) {
                                existingLead = await LeadModel.findOne({ email: email });
                            } else if (phone) {
                                existingLead = await LeadModel.findOne({ phone: phone });
                            }

                            if (existingLead) {
                                // console.log(`Lead with email ${email} or phone ${phone} already exists. Skipping.`);
                                continue;
                            }

                            const leadData = {
                                source: 'facebook_lead_ads',
                                status: 'new',
                                fullName: fullName,
                                email: email,
                                phone: phone,
                                notes: [{ note: `Imported from Facebook Lead Ads (Past Lead). Lead ID: ${lead.id}. Form: ${form.name}` }]
                            };

                            await createLeadService(leadData, conn);
                            totalLeadsImported++;

                        } catch (leadError) {
                            console.error(`Error processing lead ${lead.id}:`, leadError.message);
                            errors.push({ leadId: lead.id, error: leadError.message });
                        }
                    }

                    leadsUrl = leadsResponse.data.paging?.next;
                }

            } catch (formError) {
                console.error(`Error fetching leads for form ${form.id}:`, formError.message);
                errors.push({ formId: form.id, error: formError.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${totalLeadsImported} past leads.`,
            errors: errors.length > 0 ? errors : undefined
        }, { status: 200 });

    } catch (err) {
        console.error("Error fetching past leads:", err.response?.data || err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

function getField(fieldData, name) {
    const field = fieldData.find(f => f.name === name);
    return field?.values?.[0];
}
