import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
import { bulkAssignLeadsController } from '../../../../lib/controllers/leadController';
import { withSuperAdminOrRoleAdminAuth } from '../../../../middleware/commonAuth';

export const PUT = withSuperAdminOrRoleAdminAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const body = await request.json();
    return await bulkAssignLeadsController(body, conn);
  } catch (err) {
    //console.error('PUT /crm/leads/assign/bulk-assign error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}, '/api/crm/leads/assign/bulk-assign');