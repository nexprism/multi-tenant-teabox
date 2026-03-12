import { NextResponse } from 'next/server';
import {
  createLeadService,
  getLeadsService,
  getLeadByIdService,
  updateLeadService,
  deleteLeadService
} from '../services/leadService.js';
import { bulkAssignLeadsService } from '../services/leadService.js';
import mongoose from 'mongoose';



export const createLeadController = async (body, conn) => {
  try {
    const lead = await createLeadService(body, conn);
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create lead',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};

// export const getLeadsController = async (query, conn) => {
//   try {
//     const leads = await getLeadsService(conn); // ✅ pass conn here
//     return NextResponse.json({
//       success: true,
//       message: 'Leads fetched successfully',
//       data: leads,
//     });
//   } catch (error) {
//     return NextResponse.json({
//       success: false,
//       message: 'Failed to fetch leads',
//       error: error?.message || 'Something went wrong',
//     }, { status: 500 });
//   }
// };
export const getLeadsController = async (query, conn) => {
  try {
    const {
      leads,
      totalDocuments,
      currentPage,
      totalPages,
    } = await getLeadsService(query, conn);

    return NextResponse.json({
      success: true,
      message: 'Leads fetched successfully',
      data: {
        result: leads,
        currentPage,
        totalPages,
        totalDocuments,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch leads',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};



export const getLeadByIdController = async (id, conn) => {
  try {
    const lead = await getLeadByIdService(id, conn); // ✅ Fix: pass conn
    if (!lead) {
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead fetched successfully',
      data: lead,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch lead',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};


export const updateLeadController = async (body, id, conn) => {
  try {
    //consolle.log('Updating lead with ID:', id);
    //consolle.log('Request body:', body);

    const updated = await updateLeadService(id, body, conn);

    if (!updated) {
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to update lead',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};




export const deleteLeadController = async (id, conn) => {
  try {
    const deleted = await deleteLeadService(id, conn); // ✅ now passing conn

    if (!deleted) {
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to delete lead',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};


export const convertLeadController = async (leadId, customerId, conn) => {
  try {
    const updatedLead = await updateLeadService(leadId, {
      converted: true,
      convertedTo: customerId,
      status: 'converted',
    }, conn);

    if (!updatedLead) {
      return {
        status: 404,
        body: {
          success: false,
          message: 'Lead not found or conversion failed',
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Lead successfully converted to customer',
        data: updatedLead,
      },
    };
  } catch (error) {
    //consolle.error('Error converting lead:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Failed to convert lead',
        error: error?.message || 'Something went wrong',
      },
    };
  }
};

export const assignLeadController = async (id, body, conn) => {
  try {
    const { assignedTo } = body;
    //consolle.log('Assigning lead with ID:', id, 'to user:', assignedTo); // Debug log
    if (!assignedTo) {
      return NextResponse.json({
        success: false,
        message: 'assignedTo ID is required',
      }, { status: 400 });
    }

    const updated = await updateLeadService(id, {
      assignedTo,
      status: 'assigned'
    }, conn);

    if (!updated) {
      //consolle.error('Lead not found for ID:', id);
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead assigned and converted successfully',
      data: updated,
    });
  } catch (error) {
    //consolle.error('Error assigning lead:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to assign lead',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};

export const bulkAssignLeadsController = async (body, conn) => {
  try {
    const { leadIds, assignedTo } = body;
    if (!Array.isArray(leadIds) || leadIds.length === 0 || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid lead IDs or assignedTo ID',
      }, { status: 400 });
    }

    if (!leadIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json({
        success: false,
        message: 'One or more lead IDs are invalid',
      }, { status: 400 });
    }

    const result = await bulkAssignLeadsService(leadIds, assignedTo, conn);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} leads`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    //consolle.error('Error bulk assigning leads:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to bulk assign leads',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};


export const addLeadNoteController = async (id, body, conn) => {
  try {
    const { note, userId, nextFollowUpAt } = body;
    //consolle.log('Adding note to lead ID:', id, 'note:', note, 'userId:', userId, 'nextFollowUpAt:', nextFollowUpAt);
    if (!note) {
      return NextResponse.json({
        success: false,
        message: 'note is required',
      }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID from token',
      }, { status: 400 });
    }
    if (nextFollowUpAt && isNaN(new Date(nextFollowUpAt))) {
      return NextResponse.json({
        success: false,
        message: 'Invalid nextFollowUpAt date',
      }, { status: 400 });
    }

    const updatePayload = {
      $push: { notes: { note, createdBy: userId } },
      lastContactedAt: new Date(),
      $inc: { followUpCount: 1 }
    };
    if (nextFollowUpAt) {
      updatePayload.nextFollowUpAt = new Date(nextFollowUpAt);
    }

    const updated = await updateLeadService(id, updatePayload, conn);

    if (!updated) {
      //consolle.error('Lead not found for ID:', id);
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note added successfully',
      data: updated,
    });
  } catch (error) {
    //consolle.error('Error adding lead note:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to add note',
      error: error?.message || 'Something went wrong',
    }, { status: 500 });
  }
};
