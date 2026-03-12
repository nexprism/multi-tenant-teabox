import TicketService from '../services/ticketService.js';
import { ticketCreateValidator, ticketUpdateValidator, ticketReplyValidator } from '../../validators/ticketValidator.js';
import { saveFile, validateImageFile } from '../../config/fileUpload.js';

export async function createTicket(form, conn) {
  try {
    //consolle.log("Creating ticket with form data:", form);

    let imageUrl = '';
    let thumbnailUrl = '';
    
    //consolle.log('Create Ticket form:', form);

    const subject = form.get('subject');
    const description = form.get('description');
    const priority = form.get('priority');
    const customer = form.get('customer');
    const order_id = form.get('order_id');
    const attachments = form.getAll('attachments'); // expects multiple files

    // Build ticket data object
    const ticketData = {
      subject,
      description,
      priority,
      customer,
      orderId: order_id || null, // optional field
      attachments: []
    };

    // Handle attachments (image upload logic)
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file && file instanceof File) {
          try {
            validateImageFile(file);
            const fileUrl = await saveFile(file, 'ticket-attachments');
            ticketData.attachments.push(fileUrl);
          } catch (fileError) {
            return {
              status: 400,
              body: { success: false, message: 'Attachment upload error', data: fileError.message }
            };
          }
        } else if (typeof file === 'string') {
          // If already a string (assume it's the image name)
          ticketData.attachments.push(file);
        }
      }
    }

    const { error, value } = ticketCreateValidator.validate(ticketData);
    if (error) {
      return {
        status: 400,
        body: { success: false, message: 'Validation error', data: error.details },
      };
    }

    const service = new TicketService(conn);
    const ticket = await service.createTicket(value);
    return { status: 201, body: { success: true, message: 'Ticket created successfully', data: ticket } };
  } catch (err) {
    //consolle.error('Create Ticket Error:', err.message);
    return { status: 500, body: { success: false, message: 'Server error', data: null } };
  }
}

export async function getAllTickets(req, conn) {
  try {
    const service = new TicketService(conn);
    const tickets = await service.getAllTickets(req.query || {});
    return {
      status: 200,
      body: {
        success: true,
        message: 'Tickets fetched successfully',
        data: tickets,
      },
    };
  } catch (err) {
    //consolle.error('Get All Tickets Error:', err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Server error',
        data: null,
      },
    };
  }
}

export async function getTicketById(id, conn) {
  try {
    const service = new TicketService(conn);
    //consolle.log(`Fetching ticket with ID: ${id}`);
    
    const ticket = await service.getTicketById(id);
    if (!ticket) return { status: 404, body: { success: false, message: 'Ticket not found', data: null } };
    return { status: 200, body: { success: true, message: 'Ticket found', data: ticket } };
  } catch (err) {
    //consolle.error('Get Ticket Error:', err.message);
    return { status: 500, body: { success: false, message: 'Server error', data: null } };
  }
}

export async function updateTicket(id, data, conn) {
  try {
    // Validate input
    const { error } = ticketUpdateValidator.validate(data);
    if (error) {
      return {
        status: 400,
        body: {
          success: false,
          message: 'Validation error',
          data: error.details,
        },
      };
    }

    const service = new TicketService(conn);

    // Update the ticket
    const updated = await service.updateTicket(id, data);

    // If no document is returned, it means the ticket doesn't exist or isDeleted = true
    if (!updated) {
      return {
        status: 404,
        body: {
          success: false,
          message: 'Ticket not found or already deleted',
          data: null,
        },
      };
    }

    // Return success with updated data
    return {
      status: 200,
      body: {
        success: true,
        message: 'Ticket updated successfully',
        data: updated,
      },
    };
  } catch (err) {
    // Catch and log any unexpected server error
    //consolle.error('Update Ticket Error:', err.message);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Server error',
        data: null,
      },
    };
  }
}

// 🆕 Updated replyToTicket function with image support
export async function replyToTicket(id, data, conn) {
  try {
    //consolle.log('Reply data received:', data);

    // Process attachments if they exist
    const processedAttachments = [];
    
    if (data.attachments && Array.isArray(data.attachments)) {
      for (const attachment of data.attachments) {
        if (attachment && attachment instanceof File) {
          try {
            // Validate the image file
            validateImageFile(attachment);
            
            // Save the file and get the URL
            const fileUrl = await saveFile(attachment, 'reply-attachments');
            processedAttachments.push(fileUrl);
            
            //consolle.log('Reply attachment saved:', fileUrl);
          } catch (fileError) {
            //consolle.error('Reply attachment upload error:', fileError.message);
            return {
              status: 400,
              body: { 
                success: false, 
                message: 'Reply attachment upload error', 
                data: fileError.message 
              }
            };
          }
        } else if (typeof attachment === 'string') {
          // If already a string (assume it's a file URL)
          processedAttachments.push(attachment);
        }
      }
    }

    // Create the reply data with processed attachments
    const replyData = {
      message: data.message,
      repliedBy: data.repliedBy,
      isStaff: data.isStaff,
      attachments: processedAttachments,
      repliedAt: new Date()
    };

    //consolle.log('Final reply data:', replyData);

    // Validate the reply data
    const { error } = ticketReplyValidator.validate(replyData);
    if (error) {
      return {
        status: 400,
        body: { success: false, message: 'Validation error', data: error.details },
      };
    }

    const service = new TicketService(conn);
    const reply = await service.replyToTicket(id, replyData);
    
    return {
      status: 201,
      body: { 
        success: true, 
        message: 'Reply added successfully', 
        data: reply 
      },
    };
  } catch (err) {
    //consolle.error('Reply to Ticket Error:', err.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}

export async function deleteTicket(id, conn) {
  try {
    const service = new TicketService(conn);
    const deleted = await service.deleteTicket(id);
    if (!deleted) return { status: 404, body: { success: false, message: 'Ticket not found', data: null } };
    return { status: 200, body: { success: true, message: 'Ticket deleted successfully', data: deleted } };
  } catch (err) {
    //consolle.error('Delete Ticket Error:', err.message);
    return { status: 500, body: { success: false, message: 'Server error', data: null } };
  }
}

export async function getTicketsByCustomer(customerId, conn, query = {}) {
  try {
    const service = new TicketService(conn);
    const result = await service.getTicketsByCustomer(customerId, query);
    return {
      status: 200,
      body: {
        success: true,
        message: 'Tickets fetched successfully',
        data: result.tickets,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalDocuments: result.totalDocuments,
      },
    };
  } catch (err) {
    //consolle.error('Get Tickets by Customer Error:', err.message);
    return {
      status: 500,
      body: { success: false, message: 'Server error', data: null },
    };
  }
}