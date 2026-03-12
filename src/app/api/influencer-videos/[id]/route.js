// app/api/influencer-videos/[id]/route.js
import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import influencerVideoController from '../../../lib/controllers/InfluencerVideoController.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';
import mongoose from 'mongoose';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const id = resolvedParams.id;
    //console.log('Processing influencer video ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid influencer video ID' }, { status: 400 });
    }
    return await influencerVideoController.getInfluencerVideoById(request, null, id, conn);
  } catch (err) {
    //console.error('InfluencerVideo GET by ID error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

export const PUT = withUserAuth(async function (request, { params }) {
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
    const id = resolvedParams.id;
    //console.log('Processing influencer video ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid influencer video ID' }, { status: 400 });
    }
    return await influencerVideoController.updateInfluencerVideo(request, null, id, conn);
  } catch (err) {
    //console.error('InfluencerVideo PUT error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});

export const DELETE = withUserAuth(async function (request, { params }) {
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
    const id = resolvedParams.id;
    //console.log('Processing influencer video ID:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid influencer video ID' }, { status: 400 });
    }
    return await influencerVideoController.deleteInfluencerVideo(request, null, id, conn);
  } catch (err) {
    //console.error('InfluencerVideo DELETE error:', err.message, err.stack);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
});