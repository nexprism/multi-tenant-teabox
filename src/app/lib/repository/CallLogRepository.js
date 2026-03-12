import mongoose from 'mongoose';
import CallLogSchema from '../models/CallLog.js';
import leadSchema from '../models/Lead.js';
import userSchema from '../models/User.js';

class CallLogRepository {
  constructor() {
    this.getCallLogModel = this.getCallLogModel.bind(this);
    this.getAllCallLogs = this.getAllCallLogs.bind(this);
    this.getCallLogsByLeadId = this.getCallLogsByLeadId.bind(this);
    this.getCallLogsByAgentId = this.getCallLogsByAgentId.bind(this);
  }

  getCallLogModel(conn) {
    if (!conn) {
      throw new Error('Database connection is required');
    }
    console.log('CallLogRepository using connection:', conn.name || 'global mongoose');
    // Clear cached models for this connection to ensure updated schemas are used
    delete conn.models.CallLog;
    delete conn.models.Lead;
    delete conn.models.User;
    // Register Lead and User models to avoid "Schema hasn't been registered" error
    conn.model('Lead', leadSchema);
    conn.model('User', userSchema);
    return conn.models.CallLog || conn.model('CallLog', CallLogSchema);
  }

  async getAllCallLogs(conn, { page, limit, search, filters }) {
    const CallLog = this.getCallLogModel(conn);
    const query = {
      ...(search && {
        $or: [
          { caller: { $regex: search, $options: 'i' } },
          { agentName: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    // Apply dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (['leadId', 'agent'].includes(key) && mongoose.Types.ObjectId.isValid(value)) {
        query[key] = value;
      } else if (key === 'durationMs') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(\d+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: Number(match[2]) };
        } else {
          query[key] = Number(value);
        }
      } else if (key === 'createdAt') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(.+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: new Date(match[2]) };
        } else {
          query[key] = new Date(value);
        }
      } else {
        query[key] = value;
      }
    });
    const skip = (page - 1) * limit;
    const [callLogs, totalItems] = await Promise.all([
      CallLog.find(query)
        .populate('agent leadId')
        .skip(skip)
        .limit(limit)
        .lean(),
      CallLog.countDocuments(query),
    ]);

    return {
      callLogs,
      totalItems,
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getCallLogsByLeadId(conn, { leadId, page, limit, search, filters }) {
    const CallLog = this.getCallLogModel(conn);
    const query = {
      leadId,
      ...(search && {
        $or: [
          { caller: { $regex: search, $options: 'i' } },
          { agentName: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    // Apply dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (['leadId', 'agent'].includes(key) && mongoose.Types.ObjectId.isValid(value)) {
        query[key] = value;
      } else if (key === 'durationMs') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(\d+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: Number(match[2]) };
        } else {
          query[key] = Number(value);
        }
      } else if (key === 'createdAt') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(.+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: new Date(match[2]) };
        } else {
          query[key] = new Date(value);
        }
      } else {
        query[key] = value;
      }
    });
    const skip = (page - 1) * limit;
    const [callLogs, totalItems] = await Promise.all([
      CallLog.find(query)
        .populate('agent leadId')
        .skip(skip)
        .limit(limit)
        .lean(),
      CallLog.countDocuments(query),
    ]);

    return {
      callLogs,
      totalItems,
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getCallLogsByAgentId(conn, { agentId, page, limit, search, filters }) {
    const CallLog = this.getCallLogModel(conn);
    const query = {
      agent: agentId,
      ...(search && {
        $or: [
          { caller: { $regex: search, $options: 'i' } },
          { agentName: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    // Apply dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (['leadId', 'agent'].includes(key) && mongoose.Types.ObjectId.isValid(value)) {
        query[key] = value;
      } else if (key === 'durationMs') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(\d+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: Number(match[2]) };
        } else {
          query[key] = Number(value);
        }
      } else if (key === 'createdAt') {
        const match = value.match(/^\[(gte|gt|lte|lt)\]=(.+)$/);
        if (match) {
          query[key] = { [`$${match[1]}`]: new Date(match[2]) };
        } else {
          query[key] = new Date(value);
        }
      } else {
        query[key] = value;
      }
    });
    const skip = (page - 1) * limit;
    const [callLogs, totalItems] = await Promise.all([
      CallLog.find(query)
        .populate('agent leadId')
        .skip(skip)
        .limit(limit)
        .lean(),
      CallLog.countDocuments(query),
    ]);

    return {
      callLogs,
      totalItems,
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
    };
  }
}

export default new CallLogRepository();