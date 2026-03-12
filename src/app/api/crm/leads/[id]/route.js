import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '@/app/lib/tenantDb.js';
import { getLeadByIdService, updateLeadService, deleteLeadService } from '@/app/lib/services/leadService.js';

export async function GET(request, { params }) {
    try {
            const { id } = await params;
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        const result = await getLeadByIdService(id, conn);
        if (!result) {
            return NextResponse.json({ message: "Lead not found" }, { status: 404 });
        }
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error fetching lead:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        const body = await request.json();

        // Ensure fullName is populated if firstName/lastName are provided
        if (body.firstName || body.lastName) {
            body.fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();
        }

        // Sanitize ObjectId fields - convert empty strings to null
        const objectIdFields = ['assignedTo', 'convertedTo'];
        objectIdFields.forEach(field => {
            if (body[field] === '' || body[field] === null || body[field] === undefined) {
                body[field] = null;
            }
        });

        // Remove null values to avoid overwriting existing data with null
        Object.keys(body).forEach(key => {
            if (body[key] === null && !objectIdFields.includes(key)) {
                delete body[key];
            }
        });

        const result = await updateLeadService(id, body, conn);
        if (!result) {
            return NextResponse.json({ message: "Lead not found" }, { status: 404 });
        }
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error updating lead:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        const result = await deleteLeadService(id, conn);
        if (!result) {
            return NextResponse.json({ message: "Lead not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Lead deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting lead:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
