import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSubdomain, getDbConnection } from '../../../../../lib/tenantDb';
import { addLeadNoteController } from '../../../../../lib/controllers/leadController';
import { verifyTokenAndUser } from '../../../../../middleware/commonAuth';

export async function POST(request, { params }) {
  try {
    // ✅ Step 1: Authenticate user
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;

    const user = authResult.user;
    request.user = user;

    //console.log('Raw params:', params);
    const resolvedParams = await params;
    const id = resolvedParams.id;
    //console.log('Extracted lead ID:', id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      //console.error('Invalid lead ID:', id);
      return NextResponse.json({ success: false, message: 'Invalid lead ID' }, { status: 400 });
    }

    const subdomain = getSubdomain(request);
    //console.log('Subdomain:', subdomain);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      //console.error('Database connection failed for subdomain:', subdomain);
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    //console.log('Connected to database:', conn.name);

    const userId = request.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      //console.error('Invalid or missing user ID from request.user:', userId);
      return NextResponse.json({ success: false, message: 'Invalid or missing user ID from token' }, { status: 401 });
    }
    //console.log('User ID from token:', userId);

    const body = await request.json();
    //console.log('Request body:', body);
    return await addLeadNoteController(id, { note: body.note, nextFollowUpAt: body.nextFollowUpAt, userId }, conn);
  } catch (err) {
    //console.error('POST /crm/leads/:id/notes error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
