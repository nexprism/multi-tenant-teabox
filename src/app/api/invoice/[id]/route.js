
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSubdomain, getDbConnection } from "@/app/lib/tenantDb";
import { OrderSchema } from "@/app/lib/models/Order";
import { generateInvoiceHtml } from "@/app/lib/utils/invoiceGenerator";

export async function GET(request, ctx) {
    // Await params for Next.js 15+ compatibility
    const params = await ctx.params;
    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { success: false, message: "Invoice ID required" },
            { status: 400 }
        );
    }

    const invoicesDir = path.join(process.cwd(), "public", "uploads", "invoices");
    const safeId = path.basename(id).replace('.html', '');
    const filePath = path.join(invoicesDir, `${safeId}.html`);

    // 1. Try serving from file system
    try {
        await fs.access(filePath);
        const fileBuffer = await fs.readFile(filePath);
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    } catch (err) {
        // File not found, proceed to generate on the fly
        // console.log("Invoice file not found, generating on fly...", safeId);
    }

    // 2. Generate on the fly
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json(
                { success: false, message: "Database connection failed" },
                { status: 500 }
            );
        }

        const Order = conn.models.Order || conn.model("Order", OrderSchema);

        // safeId is assumed to be the order _id
        const order = await Order.findById(safeId).populate("items.product").lean();

        if (!order) {
            return NextResponse.json(
                { success: false, message: "Invoice not found" },
                { status: 404 }
            );
        }

        const baseUrl = new URL(request.url).origin;
        const htmlContent = generateInvoiceHtml(order, baseUrl);

        // Optionally save it back to disk for next time (fire and forget)
        try {
            await fs.mkdir(invoicesDir, { recursive: true });
            await fs.writeFile(filePath, htmlContent, "utf8");
        } catch (writeErr) {
            // console.warn("Failed to cache invoice file:", writeErr);
        }

        return new NextResponse(htmlContent, {
            headers: {
                "Content-Type": "text/html",
            },
        });

    } catch (error) {
        console.error("Error generating invoice:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate invoice" },
            { status: 500 }
        );
    }
}
