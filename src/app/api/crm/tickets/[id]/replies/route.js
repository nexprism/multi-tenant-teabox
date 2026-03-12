import { getSubdomain, getDbConnection } from '../../../../../lib/tenantDb';
import { replyToTicket } from '../../../../../lib/controllers/ticketController';
import { withUserAuth } from '../../../../../middleware/commonAuth.js';
import { validateImageFile, saveFile } from '../../../../../config/fileUpload.js';

const toNextResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/crm/tickets/[id]/replies
export const POST = withUserAuth(async function (req, { params }) {
  try {
    const subdomain = getSubdomain(req);
    const conn = await getDbConnection(subdomain);
    if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

    const { id } = params;
    const user = req.user;
    const form = await req.formData();

    const message = form.get('message');
    const attachments = form.getAll('attachments');

    const replyData = {
      message,
      repliedBy: user._id.toString(),
      isStaff: user.role !== 'customer',
      attachments: [],
    };

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file instanceof File) {
          validateImageFile(file);
          const fileUrl = await saveFile(file, 'ticket-attachments');
          replyData.attachments.push(fileUrl);
        }
      }
    }

    const result = await replyToTicket(id, replyData, conn);
    return toNextResponse(result.body, result.status);
  } catch (error) {
    console.error('POST Reply to Ticket Error:', error.message);
    return toNextResponse({ success: false, message: error.message }, 500);
  }
});
