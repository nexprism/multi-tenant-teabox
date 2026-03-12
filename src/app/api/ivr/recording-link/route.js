import { getSubdomain, getDbConnection } from '../../../lib/tenantDb';
import { getRecordingLink } from '../../../lib/controllers/ivrController';

const toNextResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const file = searchParams.get('file');

        if (!file) {
            return toNextResponse({ success: false, message: 'File identifier is required' }, 400);
        }

        const subdomain = getSubdomain(req);
        const conn = await getDbConnection(subdomain);
        if (!conn) return toNextResponse({ success: false, message: 'DB not found' }, 404);

        // Proxy the request to MyOperator via ivrController
        const result = await getRecordingLink(file, conn);
        return toNextResponse(result.body, result.status);

    } catch (error) {
        return toNextResponse({ success: false, message: error.message }, 500);
    }
}
