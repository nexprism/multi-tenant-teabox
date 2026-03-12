import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb.js';
import callLogController from '../../../../lib/controllers/CallLogController.js';
import mongoose from 'mongoose';

// GET: Fetch call logs by leadId with pagination and search
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
    const leadId = resolvedParams.leadId;
    //console.log('Processing lead ID:', leadId);
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ success: false, message: 'Invalid lead ID' }, { status: 400 });
    }
    return await callLogController.getCallLogsByLeadId(request, null, leadId, conn);
  } catch (err) {
    //console.error('CallLog GET by leadId error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}