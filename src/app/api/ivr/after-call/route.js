import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import {
  manageAfterCall,
  } from '../../../lib/controllers/ivrController';
import { NextResponse } from 'next/server';
import {verifyTokenAndUser} from '../../../middleware/commonAuth';
import roleSchema from '../../../lib/models/role.js';


export async function GET(request) {
  try {
    // Authenticate user first
    const authResult = await verifyTokenAndUser(request);
    if (authResult.error) return authResult.error;
    
    // Add user to request object for easy access
    request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    let query = Object.fromEntries(searchParams.entries());

    //console.log('user in GET /crm/leads:', request.user);

    // Role-based filtering logic
    const user = request.user;
    
    // Check if user is admin or super admin
    let isAdmin = false;
    
    if (user.isSuperAdmin) {
      isAdmin = true;
    } else if (user.role) {
      // Get role information to check if user is admin
      let roleDoc = user.role;
      
      // If role is just an ID, fetch the role document
      if (typeof roleDoc === 'string' || (roleDoc._bsontype === 'ObjectId')) {
        const RoleModel = conn.models.Role || conn.model('Role', roleSchema);
        roleDoc = await RoleModel.findById(user.role).lean();
      }
      
      // Check if role name or slug indicates admin
      if (roleDoc && (roleDoc.name === 'admin' || roleDoc.slug === 'admin' || roleDoc.name === 'Admin')) {
        isAdmin = true;
      }
    }

    // If not admin, filter leads to show only assigned ones
    if (!isAdmin) {
      query.assignedTo = user._id.toString();
      //console.log('Non-admin user - filtering leads by assignedTo:', user._id.toString());
    } else {
      //console.log('Admin user - showing all leads');
    }

    // ✅ Directly return the controller's response
    return await getLeadsController(query, conn);

  } catch (err) {
    //console.error('GET /crm/leads error:', err.message);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    // Authenticate user first
    // const authResult = await verifyTokenAndUser(request);
    // if (authResult.error) return authResult.error;
    
    // Add user to request object for easy access
    // request.user = authResult.user;

    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);

    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }

    const body = await request.json();


   
    ////console.log('user in POST /ivr/leads:', request.user);

    // ✅ Directly return the controller's response
    const result = await manageAfterCall(body, conn);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    //console.error('POST /crm/leads error:', err);
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
