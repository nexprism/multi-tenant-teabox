import { getSubdomain, getDbConnection } from '../../../../../lib/tenantDb';
import { convertLeadController } from '../../../../../lib/controllers/leadController';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const body = await request.json();
    const { customerId } = body;

    const resolvedParams = await params;
    const result = await convertLeadController(resolvedParams.id, customerId, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error('POST /crm/leads/:id/convert error:', err);
    return NextResponse.json({ success: false, message: 'Server error', error: err.message }, { status: 500 });
  }
}
