// src/app/api/plan/[id]/route.js

import { NextResponse } from 'next/server';
import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '@/app/lib/tenantDb';
import mongoose from 'mongoose';
import {
  getPlanById,
  updatePlan,
  deletePlan} from '../../../lib/controllers/planController.js';

// GET /api/plan/:id
export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status:400 });
  }
  if (id === 'search') {
    return NextResponse.json({ success: false, message: 'Use /api/plan/search for search queries.' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  const result = await getPlanById(id, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// PUT /api/plan/:id
export async function PUT(req, context) {
  const params = await context.params;
  const id = params?.id;
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  const data = await req.json();
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  const result = await updatePlan(id, data, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// PATCH /api/plan/:id
export async function PATCH(req, context) {
  const params = await context.params;
  const id = params?.id;
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  const data = await req.json();
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  const result = await updatePlan(id, data, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// DELETE /api/plan/:id
export async function DELETE(req, context) {
  const params = await context.params;
  const id = params?.id;
  const subdomain = getSubdomain(req);
  const conn = await getDbConnection(subdomain);
  if (!conn) {
    return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
  }
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID is missing' }, { status: 400 });
  }
  const result = await deletePlan(id, conn);
  return NextResponse.json(result.body, { status: result.status });
}

