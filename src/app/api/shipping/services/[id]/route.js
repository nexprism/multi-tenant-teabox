import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb.js';
import shippingController from '../../../../lib/controllers/shippingContoller.js';
import { withUserAuth } from '../../../../middleware/commonAuth.js';
import mongoose from 'mongoose';

export const GET = withUserAuth(async function (request, context) {
  try {
    // Extract params from context (params is a Promise in Next.js 15+)
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json({ success: false, error: 'Shipping ID is required' }, { status: 400 });
    }
    
    const subdomain = getSubdomain(request);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const id = params.id;
    //consolle.log('Processing shipping ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid shipping ID' }, { status: 400 });
    }
    return await shippingController.getServicesByShippingId(request, null, id, conn);
  } catch (err) {
    //consolle.error('Shipping GET by ID error:', err.message, err.stack);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

export const PUT = withUserAuth(async function (request, context) {
  try {
    // Extract params from context (params is a Promise in Next.js 15+)
    const resolvedParams = await context.params;
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ success: false, error: 'Shipping ID is required' }, { status: 400 });
    }
    
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    
    const id = resolvedParams.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid shipping ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const result = await shippingController.updateShipping(request, null, body, id, conn);
    return result;
  } catch (err) {
    console.error('Shipping PUT error:', err.message, err.stack);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update shipping method' }, { status: 500 });
  }
});

export const DELETE = withUserAuth(async function (request, context) {
  try {
    // Extract params from context (params is a Promise in Next.js 15+)
    const params = await context.params;
    if (!params || !params.id) {
      return NextResponse.json({ success: false, error: 'Shipping ID is required' }, { status: 400 });
    }
    
    const subdomain = getSubdomain(request);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const id = params.id;
    //consolle.log('Processing shipping ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid shipping ID' }, { status: 400 });
    }
    return await shippingController.deleteShipping(request, null, id, conn);
  } catch (err) {
    //consolle.error('Shipping DELETE error:', err.message, err.stack);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});