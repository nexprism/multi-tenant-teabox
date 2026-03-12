import dbConnect from '../../connection/dbConnect';
import { createTenant, getAllTenants, getTenantById, updateTenant, deleteTenant } from '../../lib/controllers/tenantController.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const result = await createTenant(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error('POST /tenant error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    //consolle.log('GET /tenant id:', id);
    if (id) {
      const result = await getTenantById(id);
      return NextResponse.json(result.body, { status: result.status });
    } else {
      const query = Object.fromEntries(searchParams.entries());
      const result = await getAllTenants(query);
      return NextResponse.json(result.body, { status: result.status });
    }
  } catch (err) {
    //consolle.error('GET /tenant error:', err);
    //consolle.log('Error details:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const result = await updateTenant(id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error('PUT /tenant error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const result = await deleteTenant(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error('DELETE /tenant error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
