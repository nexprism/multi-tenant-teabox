import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import shippingController from '../../lib/controllers/shippingContoller.js';
import { withUserAuth } from '../../middleware/commonAuth.js';

export const GET = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    return await shippingController.getAllShipping(request, null, conn);
  } catch (err) {
    //consolle.error('Shipping GET error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});

export const POST = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    //consolle.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //consolle.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //consolle.log('Connection name in route:', conn.name);
    const body = await request.json();
    //consolle.log('Request body:', JSON.stringify(body, null, 2));
    return await shippingController.createShipping(request, null, body, conn);
  } catch (err) {
    //consolle.error('Shipping POST error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});