const {executeInstructions} = require("@services/executor");
const { expect } = require('chai');

describe('executor', () => {
    test('fails when amount is 0', async () => {
        const r = await executeInstructions({ id: '1', type: 'transfer', amount: 0 });
        expect(r.status).toBe('failed');
    });


    test('holds transfer when large', async () => {
        const r = await executeInstructions({ id: '2', type: 'transfer', amount: 10001 });
        expect(r.status).toBe('held');
    });
});