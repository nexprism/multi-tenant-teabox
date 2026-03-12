// File: app/api/crm/tickets/[id]/route.js
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
import {
  getTicketById,
  updateTicket,
  deleteTicket,
} from '../../../../lib/controllers/ticketController';

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// GET /api/crm/tickets/[id] - Get ticket by ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

    if (!id) {
      return toNextResponse({ success: false, message: 'Ticket ID is required' }, 400);
    }

    const result = await getTicketById(id, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    //console.error('GET Ticket by ID Error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }
}

// PUT /api/crm/tickets/[id] - Update ticket by ID
export async function PUT(req, { params }) {
  try {
    const { id } = await params;

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return toNextResponse({ success: false, message: 'DB not found' }, 404);
    }

    if (!id) {
      return toNextResponse({ success: false, message: 'Ticket ID is required' }, 400);
    }

    const body = await req.json();
    const result = await updateTicket(id, body, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    //console.error('PUT Ticket Error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }
}


// DELETE /api/crm/tickets/[id] - Delete ticket by ID
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return toNextResponse({ success: false, message: 'DB not found' }, 404);
    }

    if (!id) {
      return toNextResponse({ success: false, message: 'Ticket ID is required' }, 400);
    }

    const result = await deleteTicket(id, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    //console.error('DELETE Ticket Error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }
}