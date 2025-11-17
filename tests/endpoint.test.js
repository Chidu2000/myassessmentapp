const request = require('supertest');
const app = require('@entry');

describe('POST /payment-instructions', () => {
    test('returns 400 if instructions missing', async () => {
    const res = await request(app).post('/payment-instructions').send({});
    expect(res.status).toBe(400);
});


test('processes instructions', async () => {
    const res = await request(app)
    .post('/payment-instructions')
    .send({ instructions: [{ type: 'transfer', amount: 10, currency: 'USD' }] });
    expect(res.status).toBe(200);
    expect(res.body.results).toBeInstanceOf(Array);
    });
});