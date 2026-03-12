import { NextResponse } from 'next/server';
import dbConnect from '@/app/connection/dbConnect';
import { getRoleById } from '@/app/lib/controllers/roleController';
import mongoose from 'mongoose';

// GET /api/role/:id
export async function GET(req, context) {
  await dbConnect();
  const { params } = context;
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }

  try {
    const result = await getRoleById(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/role/:id
export async function PATCH(req, context) {
  await dbConnect();
  const { params } = context;
  const id = params?.id;
  const data = await req.json();

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }

  try {
    const { updateRole } = await import('@/app/lib/controllers/roleController');
    const result = await updateRole(id, data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


