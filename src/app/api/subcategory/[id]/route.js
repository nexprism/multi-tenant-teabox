import { NextResponse } from 'next/server';

import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../../lib/tenantDb';
import { getSubCategoryById, updateSubCategory, deleteSubCategory } from '@/app/lib/controllers/subCategoryController';
import mongoose from 'mongoose';

// GET /api/subcategory/:id
export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const result = await getSubCategoryById(id, conn);
    if (result && result.status && result.body) {
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategory fetched', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/subcategory/:id
export async function PATCH(req, context) {
  const params = await context.params;
  const id = params?.id;
  const formData = await req.formData();
  const data = Object.fromEntries(formData.entries());
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const result = await updateSubCategory(id, data, conn);
    if (result && result.status && result.body) {
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategory updated', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/subcategory/:id
export async function DELETE(req, context) {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const result = await deleteSubCategory(id, conn);
    if (result && result.status && result.body) {
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategory deleted', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
