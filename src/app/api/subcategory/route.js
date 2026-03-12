import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../lib/tenantDb';
import { createSubCategory, getSubCategories } from '../../lib/controllers/subCategoryController';
import { NextResponse } from 'next/server';


export async function POST(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const form = await request.formData();
    const result = await createSubCategory(form, conn);
    if (result && result.status && result.body) {
      // If service returns error/successResponse
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategory created', data: result }, { status: 201 });
  } catch (err) {
    //consolle.error('POST /subcategory error:', err);
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
    const result = await getSubCategories(query, conn);
    if (result && result.status && result.body) {
      // If service returns error/successResponse
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategories fetched', data: result }, { status: 200 });
  } catch (err) {
    //consolle.error('GET /subcategory error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}