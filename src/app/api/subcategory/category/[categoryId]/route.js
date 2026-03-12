import { NextResponse } from 'next/server';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb.js';

export async function GET(req, { params }) {
  try {
    const { categoryId } = await params;
    if (!categoryId) {
      return NextResponse.json({ success: false, message: 'categoryId is required' }, { status: 400 });
    }
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const SubCategoryService = (await import('../../../../lib/services/SubCategoryService.js')).default;
    const subCategoryService = new SubCategoryService(conn);
    const result = await subCategoryService.getSubCategoriesByParentCategoryId(categoryId);
    if (result && result.status && result.body) {
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json({ success: true, message: 'Subcategories fetched', data: result }, { status: 200 });
  } catch (err) {
    //consolle.error('GET /subcategory/category/[categoryId] error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
