import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/tenantDb';
import { getCategoryById, updateCategory } from '@/app/lib/controllers/categoryController';
import { deleteCategory } from '@/app/lib/controllers/categoryController';
import mongoose from 'mongoose';
import { getSubdomain } from '@/app/lib/tenantDb';


// ...existing code...
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
    const result = await getCategoryById(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ...existing code...
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
    const form = await req.formData();
    data = Object.fromEntries(form.entries());
  } catch (jsonErr) {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  try {
    const result = await updateCategory(id, data, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/category/[id]
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
    const result = await deleteCategory(id, conn);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}




