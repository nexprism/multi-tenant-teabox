import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
import {
  updateLeadController,
  deleteLeadController,
  getLeadByIdController,
} from '../../../../lib/controllers/leadController';
import { NextResponse } from 'next/server';
import { verifyTokenAndUser } from '../../../../middleware/commonAuth';

// GET /api/crm/leads/[id]
export async function GET(request, context) {
  try {
    // Authenticate user first
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;
    
    // Add user to request object for easy access
    request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { id } = context.params;
    return await getLeadByIdController(id, conn);
  } catch (err) {
    //console.error('GET /crm/leads/:id error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/crm/leads/[id]
export async function PUT(request, context) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id } = context.params;
    return await updateLeadController(body, id, conn);
  } catch (err) {
    //console.error('PUT /crm/leads/:id error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/crm/leads/[id]
export async function DELETE(request, context) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { id } = context.params;
    return await deleteLeadController(id, conn);
  } catch (err) {
    //console.error('DELETE /crm/leads/:id error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
