import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import { NextResponse } from 'next/server';
import {
    createRole,
    getRoles,
    getRoleById,
    updateRole,
    deleteRole
} from '../../lib/controllers/roleController.js';
import { withSuperAdminOrRoleAdminAuth } from '../../middleware/commonAuth.js';

export const POST = withSuperAdminOrRoleAdminAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const body = await request.json();
        // Pass request.user to controller
        const result = await createRole(body, request.user, conn);
        return NextResponse.json(result.body, { status: result.status });
    } catch (err) {
        //consolle.error('POST /role error:', err);
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
});

export async function GET(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (id) {
            const result = await getRoleById(id, conn);
            return NextResponse.json(result.body, { status: result.status });
        } else {
            const query = Object.fromEntries(searchParams.entries());
            const result = await getRoles(query, conn);
            return NextResponse.json(result.body, { status: result.status });
        }
    } catch (err) {
        //consolle.error('GET /role error:', err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export const PUT = withSuperAdminOrRoleAdminAuth(async function(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();
        // Ensure request.user is passed to updateRole
        const result = await updateRole(id, body, request.user, conn);
        return NextResponse.json(result.body, { status: result.status });
    } catch (err) {
        //consolle.error('PUT /role error:', err);
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
});

export async function DELETE(request) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const result = await deleteRole(id, conn);
        return NextResponse.json(result.body, { status: result.status });
    } catch (err) {
        //consolle.error('DELETE /role error:', err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
