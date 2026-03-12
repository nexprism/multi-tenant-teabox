import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb.js';
import callLogController from '../../../../lib/controllers/CallLogController.js';
import mongoose from 'mongoose';

// GET: Fetch call logs by agentId with pagination, search, and filters
export async function GET(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connection name in route:', conn.name);
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;
    //console.log('Processing agent ID:', agentId);
    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return NextResponse.json({ success: false, message: 'Invalid agent ID' }, { status: 400 });
    }
    return await callLogController.getCallLogsByAgentId(request, null, agentId, conn);
  } catch (err) {
    //console.error('CallLog GET by agentId error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}