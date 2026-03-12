import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSubdomain, getDbConnection } from '../../../../../lib/tenantDb';
import { assignLeadController } from '../../../../../lib/controllers/leadController';
import { withSuperAdminOrRoleAdminAuth } from '../../../../../middleware/commonAuth';

export const PUT = withSuperAdminOrRoleAdminAuth(async function (request, { params }) {
  try {
    //console.log('Raw params:', params); // Debug log
    const resolvedParams = await params;
    const id = resolvedParams.id; // Direct access to params.id
    //console.log('Extracted lead ID:', id); // Debug log

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      //console.error('Invalid lead ID:', id);
      return NextResponse.json({ success: false, message: 'Invalid lead ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain); // Debug log
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      //console.error('Database connection failed for subdomain:', subdomain);
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connected to database:', conn.name); // Debug log

    const body = await request.json();
    //console.log('Request body:', body); // Debug log
    return await assignLeadController(id, body, conn);
  } catch (err) {
    //console.error('PUT /crm/leads/assign/:id error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
});
