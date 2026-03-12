import dbConnect from '@/app/connection/dbConnect';
import { createPlan, getPlans } from '@/app/lib/controllers/planController';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const form = await request.json();
    const result = await createPlan(form);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error('POST /subscription/plan error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const result = await getPlans(query);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    //consolle.error('GET /subscription/plan error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
