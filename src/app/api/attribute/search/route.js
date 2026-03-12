import { searchAttributesByName } from '@/app/lib/controllers/attributeController';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) {
      return new Response(JSON.stringify({ success: false, message: 'Name query param is required', data: null }), { status: 400 });
    }
    // Mock Express req/res for controller compatibility
    const mockReq = { query: { name } };
    let responsePayload;
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        responsePayload = payload;
        return this;
      }
    };
    await searchAttributesByName(mockReq, mockRes);
    return new Response(JSON.stringify(responsePayload), { status: mockRes.statusCode || 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message, data: null }), { status: 500 });
  }
}
