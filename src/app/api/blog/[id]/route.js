import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '../../../lib/tenantDb';
import { BlogRepository } from '../../../lib/repository/blogRepository';
import { updateBlogController, deleteBlogController } from '../../../lib/controllers/blogController';
import { NextResponse } from 'next/server';

// GET /api/blog/[id] - get by id or slug
export async function GET(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    const repo = new BlogRepository(conn);
    let blog;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await repo.get(id);
    } else {
      blog = await repo.model.findOne({ slug: id });
    }
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: blog });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error fetching blog' }, { status: 500 });
  }
}

// PATCH /api/blog/[id] - edit blog
export async function PATCH(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    const form = await request.formData();
    const result = await updateBlogController(form, conn, id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error updating blog' }, { status: 500 });
  }
}

// DELETE /api/blog/[id] - delete blog
export async function DELETE(request, { params }) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { id } = await params;
    const result = await deleteBlogController(conn, id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Error deleting blog' }, { status: 500 });
  }
}
