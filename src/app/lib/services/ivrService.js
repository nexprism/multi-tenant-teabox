import IVRRepository from "../repository/ivrRepository";
import LeadSchema from "../models/Lead.js";
import CallLogSchema from "../models/CallLog.js"; // Now imports only the schema

class IVRService {
  constructor(conn) {
    this.conn = conn;
    this.repo = new IVRRepository(conn);
  }

  async fetchUsersFromAPI() {
    const token = process.env.MYOPERATOR_API_TOKEN;
    const url = `https://developers.myoperator.co/user?token=${token}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch users from API: ${error.message}`);
    }
  }

  async syncUsersFromAPI() {
    try {
      const apiResult = await this.fetchUsersFromAPI();
      if (apiResult.status !== "success" || !Array.isArray(apiResult.data)) {
        throw new Error("Invalid API response");
      }
      //console.log("check api ======>")
      const users = [];
      for (const apiUser of apiResult.data) {
        const userDoc = await this.repo.upsert(apiUser);
        //console.log(" ==== > ", userDoc);
        users.push(userDoc);
      }
      return users;
    } catch (error) {
      throw new Error(`Failed to sync users: ${error.message}`);
    }
  }

  //processAfterCallData
  async processAfterCallData(body, conn) {
    try {
      // Process the after call data
      // This is a placeholder for actual processing logic
      //console.log("Processing after call data:", body);

      // --- Setup repositories ---
      const userRepo = this.repo;
      // Use schema from existing model if available, fallback to imported schema
      const LeadSchemaFinal = conn.models.Lead?.schema || LeadSchema;
      const CallLogSchemaFinal = conn.models.CallLog?.schema || CallLogSchema;
      const LeadModel = conn.models.Lead || conn.model("Lead", LeadSchemaFinal);
      const CallLogModel =
        conn.models.CallLog || conn.model("CallLog", CallLogSchemaFinal);

      // Helper functions for lead operations
      const findLead = async (query) => LeadModel.findOne(query);
      const createLead = async (data) => LeadModel.create(data);

      const caller = body._cl;
      const callerRaw = body._cr;
      const callId = body._ci;
      const callDuration = body._dr;
      const durationMs = body._ss ? parseInt(body._ss) * 1000 : 0;
      const recordingUrl = body._fu;
      const callStatus = body._ld?.[0]?._ds || "UNKNOWN";
      const disposition = body._ld?.[0]?._ac || null;

      // Agent info from webhook
      const agentData = body._ld?.[0]?._rr?.[0] || {};
      const agentName = agentData._na || null;
      const agentNumber = agentData._nr || null;
      const agentId = agentData._id || null; // MyOperator's agent ID

      let agent = null;

      // Use repository for user lookup
      if (agentId) {
        agent = await userRepo.UserModel.findOne({ ivrUuid: agentId });
      }
      if (!agent && agentNumber) {
        agent = await userRepo.UserModel.findOne({ phone: agentNumber });
      }

      let lead = await findLead({ phone: caller });
      if (!lead) {
        lead = await createLead({
          phone: caller,
          rawPhone: callerRaw,
          source: "IVR",
          status: "new",
          assignedTo: agent ? agent._id : null,
          lastContactedAt: new Date(),
          nextFollowUpAt: null,
          followUpCount: 0,
        });
      } else {
        lead.lastCallStatus = callStatus;
        lead.lastContactedAt = new Date();
        if (agent) lead.assignedTo = agent._id; // Update assignment
        await lead.save();
      }

      //check calllog already exist with same callId then update else create
      // const existingCallLog = await CallLogModel.findOne({ callId });
      // if (existingCallLog) {
      //   existingCallLog.leadId = lead._id;
      //   existingCallLog.caller = caller;
      //   existingCallLog.webhookResponse = body; // Update webhook response
      //   existingCallLog.duration = callDuration;
      //   existingCallLog.durationMs = durationMs;
      //   existingCallLog.status = callStatus;
      //   existingCallLog.disposition = disposition;
      //   existingCallLog.recordingUrl = recordingUrl;
      //   existingCallLog.agent = agent ? agent._id : null;
      //   existingCallLog.agentName = agentName;
      //   existingCallLog.agentNumber = agentNumber;
      //   await existingCallLog.save();
      // } else {
      await CallLogModel.create({
        leadId: lead._id,
        callId,
        caller,
        duration: callDuration,
        durationMs,
        status: callStatus,
        disposition,
        recordingUrl,
        agent: agent ? agent._id : null,
        agentName,
        agentNumber,
        webhookResponse: body, // Store entire webhook payload
      });
      // }
      // You can add your business logic here
      //console.log("After call data processed successfully");
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to process after call data: ${error.message}`);
    }
  }

  async getAllUsers(query = {}) {
    try {
      return await this.repo.getAll(query);
    } catch (error) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
  }

  async getUserById(id) {
    try {
      return await this.repo.getById(id);
    } catch (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
  }

  async updateUser(id, data) {
    try {
      return await this.repo.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      return await this.repo.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async getRecordingLink(file) {
    const token = process.env.MYOPERATOR_API_TOKEN || "dd7e8fe0630104c7a4b6ca226f9fc2aa";

    // Extract filename if it's a URL or has query params
    let fileName = file;
    if (file.includes('://') || file.includes('/')) {
      fileName = file.split('/').pop().split('?')[0] || file;
    } else {
      fileName = file.split('?')[0];
    }

    // Ensure it ends with .mp3 extension and avoid double extension
    if (!fileName.toLowerCase().endsWith('.mp3')) {
      fileName = `${fileName}.mp3`;
    }

    const url = `https://developers.myoperator.co/recordings/link?token=${token}&file=${fileName}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch recording link from API: ${error.message}`);
    }
  }
}

export default IVRService;
