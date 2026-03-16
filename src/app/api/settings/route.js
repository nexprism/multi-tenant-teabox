import { getSubdomain, getDbConnection } from '../../lib/tenantDb.js';
import settingController from '../../lib/controllers/SettingController.js';
import { saveFile, validateImageFile } from '../../config/fileUpload';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantParam = searchParams.get("tenant");
  const xTenant = request.headers.get("x-tenant");
  const subdomain = xTenant || tenantParam || getSubdomain(request);
  const conn = await getDbConnection(subdomain);
  return await settingController.getSetting(request, null, conn, subdomain);
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const tenantParam = searchParams.get("tenant");
  const contentType = request.headers.get('content-type') || '';
  let body = {};

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    for (const [key, value] of formData.entries()) {
      // Handle logo file uploads (accept `logo`, `logoFile`, `logo.file`)
      if (value instanceof File) {
        if (key === 'logo' || key === 'logoFile' || key === 'logo.file') {
          try {
            validateImageFile(value);
            const url = await saveFile(value, 'uploads/Settings');
            body.logo = url;
          } catch (err) {
            // Preserve other fields but don't fail the whole request
            body.logo = '';
          }
          continue;
        }

        // ignore other file fields by default
        continue;
      }

      // Normal form fields
      if (typeof value === "string") {
        const v = value.trim();
        // If value looks like JSON (array/object), try to parse it
        if ((v.startsWith("[") && v.endsWith("]")) || (v.startsWith("{") && v.endsWith("}"))) {
          try {
            body[key] = JSON.parse(value);
          } catch (e) {
            body[key] = value;
          }
        } else {
          body[key] = value;
        }
      } else {
        body[key] = value;
      }
    }
  } else {
    body = await request.json();
  }

  // Determine which tenant DB to use for saving. Prefer explicit body.tenant,
  // then x-tenant header, then ?tenant= query param, then subdomain from host.
  const targetTenant = body?.tenant || request.headers.get("x-tenant") || tenantParam || getSubdomain(request);
  const conn = await getDbConnection(targetTenant);

  console.log('[Settings Route] targetTenant=', targetTenant, 'conn=', conn && conn.name ? conn.name : (conn && conn.host) || (conn ? 'connection' : 'no-conn'));
  return await settingController.updateSetting(request, null, body, conn, targetTenant);
}
