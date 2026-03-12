import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import settingController from '../../lib/controllers/SettingController.js';

export async function GET(request) {
  const subdomain = getSubdomain(request);
  const conn = await getDbConnection(subdomain);
  return await settingController.getSetting(request, null, conn, subdomain);
}

export async function PUT(request) {
  const subdomain = getSubdomain(request);
  const conn = await getDbConnection(subdomain);
  const body = await request.json();
  return await settingController.updateSetting(request, null, body, conn, subdomain);
}
