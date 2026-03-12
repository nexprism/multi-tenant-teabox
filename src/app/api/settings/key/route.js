import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import { SettingSchema } from '../../../lib/models/Setting.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ success: false, message: 'Missing setting key' }, { status: 400 });
    }
    const SettingModel = conn.models.Setting || conn.model('Setting', SettingSchema);
    const setting = await SettingModel.findOne({ tenant: subdomain }).lean();
    if (!setting || !(key in setting)) {
      return NextResponse.json({ success: false, message: `Setting key "${key}" not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, key, value: setting[key] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
