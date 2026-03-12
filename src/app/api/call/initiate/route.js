import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../../lib/tenantDb';
import { initiateCallController } from '../../../lib/controllers/callController';
import { NextResponse } from 'next/server';



export async function POST(request) {
  // thin wrapper: auth then delegate to controller
  try {
          const tenant = request.headers.get("x-tenant");
          const subdomain = getSubdomain(request);
          const conn = await getDbConnection(subdomain);
          if (!conn) {
              return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
          }
          const body = await request.json();
          const result = await initiateCallController(body, conn, tenant);
          return NextResponse.json(result.body, { status: result.status });
      } catch (err) {
          //console.error('POST /blog error:', err);
          return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
      }
  
}
