import mongoose from "mongoose";

const CallLogSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  callId: String,
  caller: String,
  duration: String,
  durationMs: Number,
  status: String,
  disposition: String,
  recordingUrl: String,
  customerNumber: String,
  startTime: Date,
  endTime: Date,
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  agentName: String,
  agentNumber: String,
  createdAt: { type: Date, default: Date.now },
  webhookResponse: Object
});


// Remove cached model to ensure the updated schema is used
delete mongoose.models.CallLog;

export const CallLogModel = mongoose.models.CallLog || mongoose.model("CallLog", CallLogSchema);
export default CallLogSchema;
