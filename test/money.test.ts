import { describe, expect, it } from 'vitest';
import { dailyInterest, format, parse } from '../src/money.js';

describe('money', () => {
  it('parses and formats each currency without floating-point arithmetic', () => {
    expect(parse('1,200.00', 'AED')).toBe(120000n);
    expect(format(-10008n, 'BHD')).toBe('-10.008');
    expect(parse('3.334', 'BHD')).toBe(3334n);
  });
  it('rejects excess precision and malformed amounts', () => {
    expect(() => parse('1.001', 'AED')).toThrow();
    expect(() => parse('1,00.00', 'AED')).toThrow();
    expect(() => parse('-1.00', 'AED')).toThrow();
  });
  it('rounds daily interest half up', () => {
    expect(dailyInterest(parse('465.00', 'AED'))).toBe(19n);
    expect(dailyInterest(parse('37.50', 'AED'))).toBe(2n);
    expect(dailyInterest(parse('37.49', 'AED'))).toBe(1n);
  });
});
