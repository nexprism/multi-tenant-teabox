// File: app/api/crm/tickets/route.js
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { fetchAndSyncUsers } from '../../../lib/controllers/ivrController';
import { verifyTokenAndUser } from '../../../middleware/commonAuth';

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export async function GET(req) {
  try {
    // Authenticate user
    const authResult = await verifyTokenAndUser(req);
    if (authResult.error) return authResult.error;

    const user = authResult.user;
    req.user = user;

    

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

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

    //if isadmin true then can fetchAndSyncUsers othruser can not fetch

    if (!isAdmin) {
      return toNextResponse({ success: false, message: 'Only admins can fetch and sync users' }, 403);
    }

    // Fetch and sync users from third-party API, then return users from DB
    const result = await fetchAndSyncUsers(conn);
    return toNextResponse(result.body, result.status);

  } catch (error) {
    //console.error('GET /ivr/fetch-users error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }

}
   

export async function POST(req) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

    const form = await req.formData();
    const result = await createTicket(form, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    return toNextResponse({ success: false, message: error.message }, 500);
  }
}


