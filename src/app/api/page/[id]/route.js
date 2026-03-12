
import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/tenantDb';
import mongoose from 'mongoose';
import { getSubdomain } from '@/app/lib/tenantDb';
import { getPageById, updatePage, deletePage } from '@/app/lib/controllers/pageController';

// GET /api/page/[id]
export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  try {
    const result = await getPageById(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/page/[id]
export async function PUT(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  let data;
  try {
    data = await req.json();
  } catch (jsonErr) {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  try {
    const result = await updatePage(id, data, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/page/[id]
export async function DELETE(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  try {
    const result = await deletePage(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
