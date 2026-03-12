const { createMocks } = require('node-mocks-http');
const handler = require('../src/app/api/attribute/route');

describe('Attribute API Route', () => {
  it('GET /api/attribute returns success and data', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler.GET(req, res);
    const data = res._getJSONData();
    expect(res._getStatusCode()).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.message).toBe('string');
  });
});
