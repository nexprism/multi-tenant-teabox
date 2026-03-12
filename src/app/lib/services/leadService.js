import * as leadRepo from '../repository/leadRepository.js';

export const createLeadService = async (payload, conn) => {
  try {
    return await leadRepo.createLead(payload, conn); // ✅
  } catch (error) {
    //consolle.error('Error in createLeadService:', error);
    throw error;
  }
};

export const getLeadsService = async (query, conn) => {
  try {
    return await leadRepo.getLeads(query, conn);
  } catch (error) {
    //consolle.error('Error in getLeadsService:', error);
    throw error;
  }
};


export const updateLeadService = async (id, data, conn) => {
  try {
    return await leadRepo.updateLead(id, data, conn); // ✅
  } catch (error) {
    //consolle.error('Error in updateLeadService:', error);
    throw error;
  }
};

export const deleteLeadService = async (id, conn) => {
  try {
    return await leadRepo.deleteLead(id, conn); // ✅
  } catch (error) {
    //consolle.error('Error in deleteLeadService:', error);
    throw error;
  }
};


export const getLeadByIdService = async (id, conn) => {
  try {
    return await leadRepo.getLeadById(id, conn); // ✅ Fix: pass conn
  } catch (error) {
    //consolle.error('Error in getLeadByIdService:', error);
    throw error;
  }
};

export const bulkAssignLeadsService = async (leadIds, assignedTo, conn) => {
  try {
    return await leadRepo.bulkAssignLeads(leadIds, assignedTo, conn);
  } catch (error) {
    //consolle.error('Error in bulkAssignLeadsService:', error);
    throw error;
  }
};

export const addLeadNoteService = async (id, noteData, userId, conn) => {
  try {
    //consolle.log('Adding note to lead ID:', id, 'noteData:', noteData, 'userId:', userId);
    const updatePayload = {
      $push: { notes: { note: noteData.note, createdBy: userId } },
      lastContactedAt: new Date(),
      $inc: { followUpCount: 1 }
    };
    if (noteData.nextFollowUpAt) {
      updatePayload.nextFollowUpAt = new Date(noteData.nextFollowUpAt);
    }
    return await leadRepo.updateLead(id, updatePayload, conn);
  } catch (error) {
    //consolle.error('Error in addLeadNoteService:', error);
    throw error;
  }
};
