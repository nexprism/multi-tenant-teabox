import callLogService from '../services/CallLogService.js';
import { NextResponse } from 'next/server';

class CallLogController {
  async getAllCallLogs(req, _res, conn) {
    try {
      //consolle.log('[CallLogController.getAllCallLogs] Fetching all call logs', 'Connection:', conn.name || 'global mongoose');
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      const search = searchParams.get('search') || '';
      const filters = {};
      for (const [key, value] of searchParams.entries()) {
        if (!['page', 'limit', 'search'].includes(key)) {
          filters[key] = value;
        }
      }
      
      const result = await callLogService.getAllCallLogs(conn, { page, limit, search, filters });
      return NextResponse.json({ 
        status: 'success', 
        message: 'Call logs fetched successfully', 
        callLogs: result.callLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          itemsPerPage: result.itemsPerPage,
        }
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[CallLogController.getAllCallLogs] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getCallLogsByLeadId(req, _res, leadId, conn) {
    try {
      //consolle.log('[CallLogController.getCallLogsByLeadId] Fetching call logs for leadId:', leadId, 'Connection:', conn.name || 'global mongoose');
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      const search = searchParams.get('search') || '';
      const filters = {};
      for (const [key, value] of searchParams.entries()) {
        if (!['page', 'limit', 'search'].includes(key)) {
          filters[key] = value;
        }
      }
      
      const result = await callLogService.getCallLogsByLeadId(conn, { leadId, page, limit, search, filters });
      return NextResponse.json({ 
        status: 'success', 
        message: 'Call logs for lead fetched successfully', 
        callLogs: result.callLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          itemsPerPage: result.itemsPerPage,
        }
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[CallLogController.getCallLogsByLeadId] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  async getCallLogsByAgentId(req, _res, agentId, conn) {
    try {
      //consolle.log('[CallLogController.getCallLogsByAgentId] Fetching call logs for agentId:', agentId, 'Connection:', conn.name || 'global mongoose');
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      const search = searchParams.get('search') || '';
      const filters = {};
      for (const [key, value] of searchParams.entries()) {
        if (!['page', 'limit', 'search'].includes(key)) {
          filters[key] = value;
        }
      }
      
      const result = await callLogService.getCallLogsByAgentId(conn, { agentId, page, limit, search, filters });
      return NextResponse.json({ 
        status: 'success', 
        message: 'Call logs for agent fetched successfully', 
        callLogs: result.callLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          itemsPerPage: result.itemsPerPage,
        }
      }, { status: 200 });
    } catch (err) {
      //consolle.error('[CallLogController.getCallLogsByAgentId] Error:', err.message, err.stack);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }
}

const callLogController = new CallLogController();
export default callLogController;