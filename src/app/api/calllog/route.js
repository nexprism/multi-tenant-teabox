import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import callLogController from '../../lib/controllers/CallLogController.js';

// GET: Fetch all call logs with pagination, search, and dynamic filters
export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connection name in route:', conn.name);
    return await callLogController.getAllCallLogs(request, null, conn);
  } catch (err) {
    //console.error('CallLog GET error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}