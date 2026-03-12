import dbConnect from '../../connection/dbConnect';
import { NextResponse } from 'next/server';
import {    
createPlan, 
getPlans, 
getPlanById, 
updatePlan, 
deletePlan 
} from '../../lib/controllers/planController.js';

export async function POST(request) {
try {
    await dbConnect();
    const body = await request.json();
    const result = await createPlan(body);
    return NextResponse.json(result.body, { status: result.status });
} catch (err) {
    //consolle.error('POST /plan error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
}
}

export async function GET(request) {
try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
        const result = await getPlanById(id);
        return NextResponse.json(result.body, { status: result.status });
    } else {
        const query = Object.fromEntries(searchParams.entries());
        const result = await getPlans(query);
        return NextResponse.json(result.body, { status: result.status });
    }
} catch (err) {
    //consolle.error('GET /plan error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
}
}

export async function PUT(request) {
try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const result = await updatePlan(id, body);
    return NextResponse.json(result.body, { status: result.status });
} catch (err) {
    //consolle.error('PUT /plan error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
}
}

export async function DELETE(request) {
try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const result = await deletePlan(id);
    return NextResponse.json(result.body, { status: result.status });
} catch (err) {
    //consolle.error('DELETE /plan error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
}
}