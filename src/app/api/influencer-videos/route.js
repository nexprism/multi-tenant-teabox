// app/api/influencer-videos/route.js
import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import influencerVideoController from '../../lib/controllers/InfluencerVideoController.js';
import { withUserAuth } from '../../middleware/commonAuth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    return await influencerVideoController.getAllInfluencerVideos(request, null, conn);
  } catch (err) {
    //console.error('InfluencerVideo GET error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

export const POST = withUserAuth(async function (request) {
  try {
    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      //console.error('No database connection established');
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connection name in route:', conn.name);
    return await influencerVideoController.createInfluencerVideo(request, null, conn);
  } catch (err) {
    //console.error('InfluencerVideo POST error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});