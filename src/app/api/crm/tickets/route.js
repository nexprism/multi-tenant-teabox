// File: app/api/crm/tickets/route.js
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import {
  createTicket,
  getAllTickets,
} from '../../../lib/controllers/ticketController';
import roleSchema from '../../../lib/models/role';
import { verifyTokenAndUser } from '../../../middleware/commonAuth';

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// export async function GET(req) {
//   try {
//     const subdomain = getSubdomain(req);
//     const conn = await getDbConnection(subdomain);
//     if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

//     const url = new URL(req.url);
//     const result = await getAllTickets({ query: Object.fromEntries(url.searchParams.entries()) }, conn);
//     return toNextResponse(result.body, result.status);
//   } catch (error) {
//     return toNextResponse({ success: false, message: error.message }, 500);
//   }
// }

export async function GET(req) {
  try {
    // ✅ Step 1: Authenticate user
    const authResult = await verifyTokenAndUser(req);
    if (authResult.error) return authResult.error;

    const user = authResult.user;
    req.user = user;

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

    // ✅ Step 2: Parse query params
    const url = new URL(req.url);
    let query = Object.fromEntries(url.searchParams.entries());

    // ✅ Step 3: Role check
    let isAdmin = false;

    if (user.isSuperAdmin) {
      isAdmin = true;
    } else if (user.role) {
      let roleDoc = user.role;

      if (typeof roleDoc === 'string' || (roleDoc._bsontype === 'ObjectId')) {
        const RoleModel = conn.models.Role || conn.model('Role', roleSchema);
        roleDoc = await RoleModel.findById(user.role).lean();
      }

      if (
        roleDoc &&
        (roleDoc.name?.toLowerCase() === 'admin' || roleDoc.slug?.toLowerCase() === 'admin')
      ) {
        isAdmin = true;
      }
    }

    // ✅ Step 4: Enforce filtering for non-admin (staff)
    if (!isAdmin) {
      let filters = {};
      try {
        filters = JSON.parse(query.filters || '{}');
      } catch (e) {
        filters = {};
      }

      filters.assignedTo = user._id.toString(); // 🔒 Force assign filtering
      query.filters = JSON.stringify(filters);

      //console.log('[TICKETS] Staff user — only assigned tickets shown:', user._id.toString());
    } else {
      //console.log('[TICKETS] Admin user — all tickets visible');
    }

    // ✅ Step 5: Fetch tickets
    const result = await getAllTickets({ query }, conn);
    return toNextResponse(result.body, result.status);

  } catch (error) {
    //console.error('GET /crm/tickets error:', error.message);
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
