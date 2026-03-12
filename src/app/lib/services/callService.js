import callLogRepository from '../repository/CallLogRepository.js';
import leadSchema from '../models/Lead.js';
import userSchema from '../models/User.js';
import { SettingSchema } from '../models/Setting.js';
import mongoose from 'mongoose';

// Using MyOperator OBD endpoint for outbound dialing
const MYOPERATOR_URL = 'https://obd-api.myoperator.co/obd-api-v1';

function normalizePhoneDigits(s) {
  if (!s) return '';
  return String(s).replace(/[^0-9]/g, '');
}

export default class CallService {
  constructor(conn) {
    this.conn = conn;
    this.callLogRepo = callLogRepository;
  }

  getLeadModel() {
    return this.conn.models.Lead || this.conn.model('Lead', leadSchema);
  }

  getUserModel() {
    return this.conn.models.User || this.conn.model('User', userSchema);
  }

  async initiateCall(leadId, tenant, agentId, directAgentNumber) {
    if (!leadId) throw new Error("leadId required");

    const conn = this.conn;
    const Lead = this.getLeadModel();
    const lead = await Lead.findById(leadId);

    console.log("CallService.initiateCall for lead:", leadId, "found lead:", !!lead);

    if (!lead) throw new Error("Lead not found");
    if (!lead.phone) throw new Error("Lead has no phone number");



    // Resolve agent number (the agent who will receive the outbound ring)
    let agentNumber = directAgentNumber || null;

    // 1. Try specific agent if requested (e.g. current user) and no direct number provided
    if (!agentNumber && agentId) {
      const User = this.getUserModel();
      try {
        const agent = await User.findById(agentId).lean();
        if (agent && agent.phone) {
          agentNumber = agent.phone;
          console.log("Using requested agent phone:", agentNumber);
        }
      } catch (e) {
        console.warn("Failed to lookup requested agent:", e.message);
      }
    }

    // 2. Fallback to assigned agent
    if (!agentNumber && lead.assignedTo) {
      const User = this.getUserModel();
      try {
        const assignedUser = await User.findById(lead.assignedTo).lean();
        if (assignedUser && assignedUser.phone) agentNumber = assignedUser.phone;
      } catch (e) {
        // ignore
      }
    }
    // 3. Fallback to env if present
    agentNumber = agentNumber || process.env.MYOPERATOR_AGENT_NUMBER || null;
    if (!agentNumber) throw new Error("No agent number available to initiate call");

    const customerNumber = lead.phone;

    // Helper function to normalize phone numbers
    const normalizePhone = (phoneStr) => {
      if (!phoneStr) return '';
      // Remove all non-digit characters except +
      let cleaned = String(phoneStr).replace(/[^\d+]/g, '');
      // Remove existing +91 or 91 prefix
      cleaned = cleaned.replace(/^\+91/, '').replace(/^91/, '');
      // Return only the 10-digit number
      return cleaned.slice(-10);
    };

    const Setting =
      conn.models.Setting || conn.model("Setting", SettingSchema);
    const settings = await Setting.findOne({ tenant }).lean();

    // Build OBD payload
    const obdBody = {
      company_id: settings.myOperatorCompanyId || "683aebae503f2118",
      secret_token:
        settings.myOperatorSecretToken ||
        "2a67cfdb278391cf9ae47a7fffd6b0ec8d93494ff0004051c0f328a501553c98",
      type: "1",
      number_2: '+91' + normalizePhone(customerNumber),
      number: '+91' + normalizePhone(agentNumber),
      public_ivr_id: settings.myOperatorpeertopeerId || null,
    };

    console.log("CallService.initiateCall obdBody:", obdBody);


    if (!obdBody.company_id || !obdBody.secret_token) {
      throw new Error('Missing MyOperator OBD company_id or secret_token in environment');
    }

    let responseBody = null;
    let httpStatus = null;
    try {
      const res = await fetch(MYOPERATOR_URL, {
        method: 'POST',
        headers: {
          'x-api-key': settings.myOperatorApiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obdBody),
      });

      httpStatus = res.status;
      console.log('MyOperator HTTP Status:', res.status, res.statusText);

      try {
        responseBody = await res.json();
      } catch (err) {
        responseBody = { raw: await res.text() };
      }
      console.log('MyOperator OBD response:', JSON.stringify(responseBody, null, 2));

      // Log if response is not successful
      if (!res.ok) {
        console.error('MyOperator API returned error status:', httpStatus, responseBody);
      }
    } catch (err) {
      console.error('Failed to reach MyOperator OBD API:', err.message);
      throw new Error('Failed to reach MyOperator OBD API: ' + err.message);
    }

    // Extract call ID safely - MyOperator returns unique_id for successful requests
    const callId = responseBody?.call_id ||
      responseBody?.callId ||
      responseBody?.data?.call_id ||
      responseBody?.unique_id ||
      null;

    // Log warning if callId is null
    if (!callId) {
      console.warn('WARNING: MyOperator did not return a call_id or unique_id. Response:', responseBody);
    }

    // // Save CallLog
    // try {
    //   const CallLog = this.callLogRepo.getCallLogModel(conn);
    //   const entry = new CallLog({
    //     leadId: lead._id,
    //     callId,
    //     agentNumber,
    //     customerNumber,
    //     status: callId ? 'initiated' : 'failed',
    //     createdAt: new Date(),
    //     webhookResponse: responseBody,
    //   });
    //   await entry.save();
    // } catch (err) {
    //   console.error('CallService: failed to save call log', err.message);
    // }

    // Update lead
    try {
      lead.lastCallStatus = callId ? "initiated" : "failed";
      lead.status = "attempted"; // recommended
      lead.lastContactedAt = new Date();
      lead.followUpCount = (lead.followUpCount || 0) + 1;
      await lead.save();
    } catch (err) {
      console.error("CallService: failed to update lead", err.message);
    }

    return {
      callId,
      lead,
      myOperatorResponse: responseBody,
      httpStatus
    };
  }


  // Process webhook body from MyOperator
  async handleWebhook(body) {
    const conn = this.conn;
    const Lead = this.getLeadModel();
    const CallLog = this.callLogRepo.getCallLogModel(conn);

    // Extract MyOperator fields (handles alternate names)
    const call_id = body.call_id || body.callId || null;
    const status = body.status || null;
    const duration = body.duration || null;
    const customer_number = body.customer_number || null;
    const start_time = body.start_time ? new Date(body.start_time) : null;
    const end_time = body.end_time ? new Date(body.end_time) : null;
    const recording_url = body.recording_url || null;

    // Normalize phone to find lead
    const findByPhone = async (phone) => {
      if (!phone) return null;
      const digits = normalizePhoneDigits(phone);

      let lead = await Lead.findOne({ phone }).exec();
      if (lead) return lead;

      lead = await Lead.findOne({ phone: digits }).exec();
      if (lead) return lead;

      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        lead = await Lead.findOne({
          phone: { $regex: new RegExp(last10 + "$") },
        }).exec();
        if (lead) return lead;
      }

      return null;
    };

    const lead = await findByPhone(customer_number);

    // Update lead if found
    if (lead) {
      try {
        const update = {
          lastCallStatus: status || lead.lastCallStatus,
          lastContactedAt: new Date(),
          updatedAt: new Date(),
        };

        if (status === "missed") {
          update.nextFollowUpAt = new Date(Date.now() + 60 * 60 * 1000);
        }

        if (status === "completed") {
          update.status = "contacted";
        }

        await Lead.findByIdAndUpdate(lead._id, update);
      } catch (err) {
        console.warn("CallService webhook: failed updating lead", err.message);
      }
    }

    // Upsert CallLog
    try {
      const update = {
        callId: call_id,
        status,
        duration: duration ? String(duration) : undefined,
        durationMs: typeof duration === "number" ? duration * 1000 : undefined,
        customerNumber: customer_number || undefined,
        startTime: start_time || undefined,
        endTime: end_time || undefined,
        recordingUrl: recording_url || undefined,
        webhookResponse: body,
      };

      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

      if (lead) update.leadId = lead._id;

      await CallLog.findOneAndUpdate(
        { callId: call_id },
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("CallService webhook: failed to upsert calllog", err.message);
    }

    return { success: true };
  }

}
