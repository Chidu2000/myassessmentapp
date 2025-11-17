const {parseInstructions} = require("@services/parser");
const { expect } = require('chai');

describe('parser', () => {
    test('adds id when missing and uppercases currency', () => {
        const r = parseInstructions({ type: 'transfer', amount: 10, currency: 'usd' });
        expect(r.id).toBeDefined();
        expect(r.currency).toBe('USD');
    });

    test('throws on invalid instruction', () => {
        expect(() => parseInstructions({ amount: 10 })).toThrow();
    });
});