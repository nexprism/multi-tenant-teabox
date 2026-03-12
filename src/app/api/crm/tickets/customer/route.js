import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
import { getTicketsByCustomer } from '../../../../lib/controllers/ticketController';
import { withUserAuth } from '../../../../middleware/commonAuth.js';

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Using the user info from the token instead of URL params
export const GET = withUserAuth(async function (req, context) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn)
      return toNextResponse({ success: false, message: 'DB not found' }, 404);

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    // ✅ Get the customerId from the authenticated user
    const customerId = req.user._id;

    const result = await getTicketsByCustomer(customerId, conn, query);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    console.error('GET Tickets by Customer Error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }
});

