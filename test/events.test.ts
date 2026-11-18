import { describe, expect, it } from 'vitest';
import { Ledger } from '../src/ledger.js';

describe('event rules', () => {
  it('holds funds, releases the whole hold at settlement and rejects duplicates', () => {
    const l = new Ledger({ A: 'AED' });
    l.apply({ id: 'c', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '250.00' });
    l.apply({ id: 'a', type: 'AUTHORIZATION', account: 'A', booked: 1, value: 1, authId: 'auth', amount: '200.00' });
    l.apply({ id: 'b', type: 'AUTHORIZATION', account: 'A', booked: 1, value: 1, authId: 'other', amount: '60.00' });
    expect(l.auths.get('auth')?.at(-1)?.state).toBe('APPROVED');
    expect(l.auths.get('other')?.at(-1)?.state).toBe('DECLINED');
    expect(l.balance('A', 1)).toBe(25000n);
    l.apply({ id: 's', type: 'SETTLEMENT', account: 'A', booked: 1, value: 1, authId: 'auth', amount: '185.00' });
    l.apply({ id: 's', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '1.00' });
    expect(l.balance('A', 1)).toBe(6500n);
    expect(l.auths.get('auth')?.at(-1)?.state).toBe('SETTLED');
    expect(l.log.at(-1)).toContain('duplicate event id');
  });
  it('rejects unknown or oversized settlement and duplicate reversal', () => {
    const l = new Ledger({ A: 'AED' });
    l.apply({ id: 'd', type: 'DEBIT', account: 'A', booked: 1, value: 1, amount: '10.00' });
    l.apply({ id: 'r', type: 'REVERSAL', account: 'A', booked: 1, value: 1, target: 'd' });
    l.apply({ id: 'r2', type: 'REVERSAL', account: 'A', booked: 1, value: 1, target: 'd' });
    l.apply({ id: 's', type: 'SETTLEMENT', account: 'A', booked: 1, value: 1, authId: 'missing', amount: '5.00' });
    expect(l.balance('A', 1)).toBe(0n);
    expect(l.entries).toHaveLength(2);
    expect(l.log).toHaveLength(2);
  });
});
