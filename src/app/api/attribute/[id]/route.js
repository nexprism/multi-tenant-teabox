// src/app/api/attribute/[id]/route.js

import { NextResponse } from 'next/server';
import { getSubdomain } from '@/app/lib/tenantDb';
import { getDbConnection } from '@/app/lib/tenantDb';
import mongoose from 'mongoose';
import {
  getAttributeById,
  updateAttribute,
  deleteAttribute,
  searchAttributesByName
} from '@/app/lib/controllers/attributeController';

// GET /api/attribute/:id
export async function GET(req, context) {
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
  if (id === 'search') {
    return NextResponse.json({ success: false, message: 'Use /api/attribute/search for search queries.' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 });
  }
  const result = await getAttributeById(id, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// PUT /api/attribute/:id
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
  const result = await updateAttribute(id, data, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// PATCH /api/attribute/:id
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
  const result = await updateAttribute(id, data, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// DELETE /api/attribute/:id
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
  //console.log("Deleting attribute with ID:", id);
  const result = await deleteAttribute(id, conn);
  return NextResponse.json(result.body, { status: result.status });
}

// SEARCH /api/attribute/:id?name=Material
// export async function SEARCH(req, context) {
//   const { params } = context;
//   const id = params?.id;
//   const subdomain = getSubdomain(req);
//   const conn = await getDbConnection(subdomain);
//   if (!conn) {
//     return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
//   }
//   const url = new URL(req.url);
//   const name = url.searchParams.get('name');
//   if (id !== 'search') {
//     return NextResponse.json({ success: false, message: 'Invalid search route. Use /api/attribute/search.' }, { status: 400 });
//   }
//   if (!name) {
//     return NextResponse.json({ success: false, message: 'Name query param is required', data: null }, { status: 400 });
//   }
//   const result = await searchAttributesByName({ query: { name } }, conn);
//   return NextResponse.json(result.body, { status: result.status });
// }