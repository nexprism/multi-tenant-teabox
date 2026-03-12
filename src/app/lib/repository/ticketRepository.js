import mongoose from 'mongoose';
import CrudRepository from './CrudRepository'; // Removed duplicate import
import TicketSchema from '../models/Ticket';
import UserSchema from '../models/User';

class TicketRepository extends CrudRepository {
  constructor(conn) {
    const TicketModel = conn.models.Ticket || conn.model('Ticket', TicketSchema);
    super(TicketModel);
    this.Ticket = TicketModel;
    this.User = conn.models.User || conn.model('User', UserSchema); // Register User model
    this.connection = conn || mongoose;
    console.log('TicketRepository initialized with connection:', this.connection ? this.connection.name || 'global mongoose' : 'no connection');
  }

  async create(data, conn) {
    try {
      // console.log('Creating ticket with data:', JSON.stringify(data, null, 2));
      return await this.Ticket.create(data);
    } catch (error) {
      console.error('TicketRepository Create Error:', error.message);
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async getAll(filterConditions = {}, sortConditions = {}, page = 1, limit = 10, populateFields = [], selectFields = {}) {
  try {
    const skip = (page - 1) * limit;

    const defaultPopulate = [
      { path: 'customer', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'replies.repliedBy', select: 'name email' }
    ];
    const combinedPopulate = [...defaultPopulate, ...populateFields];

    let query = this.Ticket.find(filterConditions)
      .select(selectFields)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    for (const field of combinedPopulate) {
      query = query.populate(field);
    }

    const data = await query.exec();
    const total = await this.Ticket.countDocuments(filterConditions);

    return {
      data,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('TicketRepository getAll Error:', error.message);
    throw new Error(`Failed to get tickets: ${error.message}`);
  }
}


  async getById(id, conn) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ticketId: ${id}`);
      }
      const ticket = await this.Ticket.findById(id).exec();
      if (!ticket || ticket.isDeleted) {
        throw new Error('Ticket not found');
      }
      return ticket;
    } catch (error) {
      console.error('TicketRepository getById Error:', error.message);
      throw new Error(`Failed to get ticket by ID: ${error.message}`);
    }
  }

  // async update(id, data, conn) {
  //   try {
  //     if (!mongoose.Types.ObjectId.isValid(id)) {
  //       throw new Error(`Invalid ticketId: ${id}`);
  //     }
  //     const ticket = await this.Ticket.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  //     if (!ticket || ticket.isDeleted) {
  //       throw new Error('Ticket not found');
  //     }
  //     return ticket;
  //   } catch (error) {
  //     console.error('TicketRepository update Error:', error.message);
  //     throw new Error(`Failed to update ticket: ${error.message}`);
  //   }
  // }

async update(id, data) {
  try {
    console.log('Updating ticket:', { id, data });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ticketId: ${id}`);
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const updateData = { ...data };

    console.log('Finding ticket with filter:', { _id: objectId, isDeleted: false });
    const existingTicket = await this.Ticket.findOne({ _id: objectId, isDeleted: false }).exec();

    console.log('Ticket found:', existingTicket);

    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    if (data.assignedTo && !data.status) {
  const currentStatus = existingTicket.status;
  if (currentStatus === 'open' || currentStatus === 'in_progress') {
    updateData.status = 'in_progress';
  }
}
    console.log('Updating ticket with data:', updateData);
    const ticket = await this.Ticket.findOneAndUpdate(
      { _id: objectId, isDeleted: false },
      { $set: updateData },
      { new: true }
    ).exec();

    console.log('Updated ticket:', ticket);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  } catch (error) {
    console.error('TicketRepository update Error:', error.message);
    throw new Error(`Failed to update ticket: ${error.message}`);
  }
}




 async findByCustomer(customerId, query = {}) {
  try {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error(`Invalid customerId: ${customerId}`);
    }

    const {
      search = '',
      status,
      priority,
      page = 1,
      limit = 10,
    } = query;

    const filter = {
      customer: customerId,
      isDeleted: false,
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, totalDocuments] = await Promise.all([
      this.Ticket.find(filter)
        .populate('assignedTo')
        .populate('customer')
        .populate('replies.repliedBy', 'name email') // Populate reply author details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),

      this.Ticket.countDocuments(filter),
    ]);

    return {
      tickets,
      totalDocuments,
      currentPage: Number(page),
      totalPages: Math.ceil(totalDocuments / Number(limit)),
    };
  } catch (error) {
    console.error('TicketRepository findByCustomer Error:', error.message);
    throw new Error(`Failed to find tickets by customer: ${error.message}`);
  }
}


  async replyToTicket(ticketId, reply, conn) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new Error(`Invalid ticketId: ${ticketId}`);
      }
      const ticket = await this.Ticket.findByIdAndUpdate(
        ticketId,
        { $push: { replies: reply } },
        { new: true }
      ).exec();
      if (!ticket || ticket.isDeleted) {
        throw new Error('Ticket not found');
      }
      return ticket;
    } catch (error) {
      console.error('TicketRepository replyToTicket Error:', error.message);
      throw new Error(`Failed to reply to ticket: ${error.message}`);
    }
  }

  async getRecentTickets(limit = 5, populateFields = [], conn) {
    try {
      let query = this.Ticket.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(limit);

      if (populateFields.length > 0) {
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }

      const tickets = await query.exec();
      return tickets;
    } catch (error) {
      console.error('TicketRepository getRecentTickets Error:', error.message);
      throw new Error(`Failed to fetch recent tickets: ${error.message}`);
    }
  }
}

export default TicketRepository;