// import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
// import { upsertLeadFromMetaService } from '../../../../lib/services/leadService.js';
// import { NextResponse } from 'next/server';

// // NEW route: POST /api/meta/leads
// export async function POST(request) {
//   try {
//     // Optional shared secret verification
//     const secretHeader = request.headers.get('x-meta-secret');
//     const expected = process.env.META_LEAD_SECRET;
//     if (expected && secretHeader !== expected) {
//       return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 403 });
//     }

//     const subdomain = getSubdomain(request);
//     const conn = await getDbConnection(subdomain);
//     if (!conn) {
//       return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
//     }

//     const body = await request.json();

//     const lead = await upsertLeadFromMetaService(body, conn);
//     return NextResponse.json({ success: true, message: 'Lead upserted from Meta', data: lead }, { status: 200 });
//   } catch (err) {
//     return NextResponse.json({ success: false, message: err.message || 'Failed to upsert lead' }, { status: 500 });
//   }
// }
