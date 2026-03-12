const request = require('supertest');

// Update this to your actual server entry point
const app = require('../src/app');

describe('Attribute API', () => {
  it('GET /api/attribute should return success and data', async () => {
    const res = await request(app).get('/api/attribute');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.message).toBe('string');
  });

  // Add more tests for POST, PUT, DELETE, etc. as needed
});
