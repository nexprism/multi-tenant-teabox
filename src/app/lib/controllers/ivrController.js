import IVRService from '../services/ivrService';

export async function fetchAndSyncUsers(conn) {
  try {
    const ivrService = new IVRService(conn);
    await ivrService.syncUsersFromAPI();
    const users = await ivrService.getAllUsers();
    return { body: { success: true, users }, status: 200 };
  } catch (error) {
    return { body: { success: false, message: error.message }, status: 500 };
  }
}

export async function manageAfterCall(body, conn) {
  try {
    const ivrService = new IVRService(conn);
    return ivrService.processAfterCallData(body, conn);

  } catch (error) {
    console.error('Controller manageAfterCall error:', error.message);
    throw error;
  }
}
export async function getRecordingLink(file, conn) {
  try {
    const ivrService = new IVRService(conn);
    const result = await ivrService.getRecordingLink(file);
    return { body: result, status: 200 };
  } catch (error) {
    return { body: { success: false, message: error.message }, status: 500 };
  }
}
