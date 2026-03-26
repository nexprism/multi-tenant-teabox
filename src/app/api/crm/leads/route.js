import { NextResponse } from "next/server";
import { getSubdomain, getDbConnection } from "@/app/lib/tenantDb.js";
import {
  getLeadsService,
  createLeadService,
} from "@/app/lib/services/leadService.js";

export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    const { searchParams } = new URL(request.url);

    // Basic query params
    const query = {
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      source: searchParams.get("source"),
      assignedTo: searchParams.get("assignedTo"),
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    };

    // Accept a JSON `filters` parameter (URL-encoded JSON string)
    // Example: filters={"isDeleted":false,"assignedTo":"...","lastCallStatus":"interested"}
    const filtersParam = searchParams.get("filters");
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam);
        // Merge parsed filters into the query object so downstream service/repo can use them
        Object.assign(query, parsed);
      } catch (err) {
        console.warn("Invalid filters JSON:", filtersParam, err);
      }
    }

    const result = await getLeadsService(query, conn);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    const body = await request.json();

    // Special handling for newsletter subscriptions
    if (body.source === "newsletter") {
      const Lead = conn.models.Lead || conn.model("Lead", (await import("@/app/lib/models/Lead.js")).default);

      // Validate email
      if (!body.email || !body.email.trim()) {
        return NextResponse.json(
          { success: false, message: "Email is required" },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { success: false, message: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check for existing newsletter subscription
      const existingLead = await Lead.findOne({
        email: body.email.trim().toLowerCase(),
        source: "newsletter",
      });

      if (existingLead) {
        return NextResponse.json(
          {
            success: true,
            message: "You are already subscribed to our newsletter!",
            data: existingLead,
          },
          { status: 200 }
        );
      }

      // Prepare newsletter lead data
      const leadData = {
        email: body.email.trim().toLowerCase(),
        source: "newsletter",
        status: "new",
        fullName: body.fullName || body.email.split("@")[0],
        notes: [{ note: "Subscribed via newsletter form on website" }],
      };

      const result = await createLeadService(leadData, conn);

      // Send confirmation email
      try {
        const EmailService = (await import("@/app/lib/services/EmailService.js")).default;
        const emailService = new EmailService();

        // Try to use a template if it exists
        const templateName = "Newsletter Subscription";
        const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || `https://${subdomain || 'www'}.customdomain.com`;
        
        let brandName = subdomain || "E-Commerce Store";
        try {
          // Use ES import for dbConnect to avoid case-sensitivity issues
          // and ensure consistency across environments
          // Import at the top of the file for best practice
          await dbConnect();
          const mongoose = require("mongoose");
          const tenantSchema = new mongoose.Schema({
            tenantId: String,
            companyName: String,
            subdomain: String,
          }, { collection: 'tenants' });
          const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
          const tenantData = await Tenant.findOne({ subdomain: subdomain }).lean();
          if (tenantData?.companyName) {
            brandName = tenantData.companyName;
          }
        } catch(err) {
            console.error(err);
        }

        const replacements = {
          fullName: leadData.fullName || 'Subscriber',
          email: leadData.email,
          site_url: siteUrl,
          brand_name: brandName
        };

        try {
          // Attempt to send using template
          const emailResponse = await emailService.sendOrderEmail({
            templateName,
            to: leadData.email,
            replacements,
            conn
          });

          if (!emailResponse.success) {
            console.warn("Failed to send newsletter email via template, falling back to basic email:", emailResponse.message);
            // Fallthrough to basic email
            throw new Error("Template fallback");
          }
          console.log(`Newsletter confirmation email sent using template to ${leadData.email}`);
        } catch (templateError) {
          // Fallback to basic email if template fails or doesn't exist
          await emailService.sendEmail({
            to: leadData.email,
            subject: `Welcome to ${brandName} Newsletter!`,
            html: `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #236339; margin-bottom: 10px;">Welcome to ${brandName}!</h1>
                  <p style="font-size: 18px; color: #666;">Thank you for subscribing to our newsletter.</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                  <p>Hi ${leadData.fullName || 'Subscriber'},</p>
                  <p>We're thrilled to have you join our community! From now on, you'll be the first to know about:</p>
                  <ul style="padding-left: 20px;">
                    <li>New tea arrivals and organic products</li>
                    <li>Exclusive subscriber-only updates</li>
                    <li>Expert tips on organic living and wellness</li>
                    <li>Stories from our organic gardens</li>
                  </ul>
                </div>
                
                <div style="text-align: center;">
                  <a href="${siteUrl}" style="display: inline-block; background-color: #236339; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Visit Our Store</a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
                  <p>Best Regards,<br><strong style="color: #236339;">The ${brandName} Team</strong></p>
                  <p style="margin-top: 20px;">
                    You are receiving this email because you subscribed at our website.<br>
                    <a href="#" style="color: #999; text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: #999; text-decoration: underline;">Privacy Policy</a>
                  </p>
                </div>
              </div>
            `
          });
          console.log(`Newsletter confirmation email sent using basic fallback to ${leadData.email}`);
        }
      } catch (emailError) {
        console.error("Critical error sending newsletter confirmation email:", emailError);
        // We continue anyway as the lead was already created successfully
      }

      return NextResponse.json(
        {
          success: true,
          message: "Successfully subscribed to newsletter!",
          data: result,
        },
        { status: 201 }
      );
    }

    // Regular lead creation for other sources
    // Ensure fullName is populated if firstName/lastName are provided
    if (body.firstName || body.lastName) {
      body.fullName = `${body.firstName || ""} ${body.lastName || ""}`.trim();
    }

    // Sanitize ObjectId fields - convert empty strings to null
    const objectIdFields = ["assignedTo", "convertedTo"];
    objectIdFields.forEach((field) => {
      if (
        body[field] === "" ||
        body[field] === null ||
        body[field] === undefined
      ) {
        body[field] = null;
      }
    });

    const result = await createLeadService(body, conn);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);

    // Handle duplicate key errors (MongoDB unique index)
    if (error.code === 11000 || error.message?.includes("duplicate")) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already subscribed to our newsletter.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}
