
import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../lib/tenantDb';
import { createPage } from '../../lib/controllers/pageController';
import { NextResponse } from 'next/server';
import PageService from '../../lib/services/pageService.js';

export async function POST(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const data = await request.json();
    const result = await createPage(data, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const pageService = new PageService(conn);
    const result = await pageService.getAllPages(query);
    // If groupByMainTitle param is set, change message
    const isGrouped = query.groupByMainTitle === 'true' || query.groupByMainTitle === true;
    return NextResponse.json({
      success: true,
      message: isGrouped ? 'Pages grouped by mainTitle' : 'Pages fetched successfully',
      data: result.data
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
