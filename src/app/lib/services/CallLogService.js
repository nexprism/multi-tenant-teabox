import callLogRepository from '../repository/CallLogRepository.js';

class CallLogService {
  async getAllCallLogs(conn, { page = 1, limit = 10, search = '', filters = {} }) {
    //consolle.log('[CallLogService.getAllCallLogs] Fetching all call logs', 'Connection:', conn.name || 'global mongoose', 'Page:', page, 'Limit:', limit, 'Search:', search, 'Filters:', filters);
    return await callLogRepository.getAllCallLogs(conn, { page, limit, search, filters });
  }

  async getCallLogsByLeadId(conn, { leadId, page = 1, limit = 10, search = '', filters = {} }) {
    //consolle.log('[CallLogService.getCallLogsByLeadId] Fetching call logs for leadId:', leadId, 'Connection:', conn.name || 'global mongoose', 'Page:', page, 'Limit:', limit, 'Search:', search, 'Filters:', filters);
    return await callLogRepository.getCallLogsByLeadId(conn, { leadId, page, limit, search, filters });
  }

  async getCallLogsByAgentId(conn, { agentId, page = 1, limit = 10, search = '', filters = {} }) {
    //consolle.log('[CallLogService.getCallLogsByAgentId] Fetching call logs for agentId:', agentId, 'Connection:', conn.name || 'global mongoose', 'Page:', page, 'Limit:', limit, 'Search:', search, 'Filters:', filters);
    return await callLogRepository.getCallLogsByAgentId(conn, { agentId, page, limit, search, filters });
  }
}

const callLogService = new CallLogService();
export default callLogService;