import mongoose from 'mongoose';
import TicketRepository from '../repository/ticketRepository';

class TicketService {
  constructor(conn) {
    this.conn = conn;
    this.repo = new TicketRepository(conn);
  }

  async createTicket(data) {
    try {
    return await this.repo.create(data);
    } catch (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async getAllTickets(query = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      filters = '{}',
      searchFields = '{}',
      sort = '{}',
      populateFields = '[]',
      selectFields = '{}'
    } = query;

    const parsedFilters = JSON.parse(filters || '{}');
    const parsedSearchFields = JSON.parse(searchFields || '{}');
    const parsedSort = JSON.parse(sort || '{}');
    const parsedPopulateFields = JSON.parse(populateFields || '[]');
    const parsedSelectFields = JSON.parse(selectFields || '{}');
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const filterConditions = { isDeleted: false, ...parsedFilters };

    const searchConditions = Object.entries(parsedSearchFields).map(([field, value]) => ({
      [field]: { $regex: value, $options: 'i' }
    }));
    if (searchConditions.length > 0) {
      filterConditions.$or = searchConditions;
    }

    const sortConditions = {};
    for (const [field, direction] of Object.entries(parsedSort)) {
      sortConditions[field] = direction === 'asc' ? 1 : -1;
    }

    return await this.repo.getAll(
      filterConditions,
      sortConditions,
      parsedPage,
      parsedLimit,
      parsedPopulateFields,
      parsedSelectFields
    );
  } catch (error) {
    throw new Error(`Failed to get all tickets: ${error.message}`);
  }
}


  async getTicketById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid ticket ID');
      }
      return await this.repo.getById(id);
    } catch (error) {
      throw new Error(`Failed to get ticket by ID: ${error.message}`);
    }
  }

  async updateTicket(id, data) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid ticket ID');
      }
      //console.log(`Updating ticket with ID: ${id}`, data);
      
      const updated = await this.repo.update(id, data);
      //console.log('Updated Ticket:', updated);
      return updated;
    } catch (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  }

  async deleteTicket(id) {
    try {
      const result = await this.repo.delete(id);
      //console.log('Delete result:', result);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  async replyToTicket(ticketId, replyData) {
    try {
      return await this.repo.replyToTicket(ticketId, replyData);
    } catch (error) {
      throw new Error(`Failed to reply to ticket: ${error.message}`);
    }
  }

 async getTicketsByCustomer(customerId, query = {}) {
  try {
    return await this.repo.findByCustomer(customerId, query);
  } catch (error) {
    throw new Error(`Failed to get tickets by customer: ${error.message}`);
  }
}


  async getRecentTickets(limit = 5) {
    try {
      return await this.repo.getRecentTickets(limit, ['customer', 'assignedTo']);
    } catch (error) {
      throw new Error(`Failed to fetch recent tickets: ${error.message}`);
    }
  }
}

export default TicketService;
