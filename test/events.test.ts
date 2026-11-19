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
    l.apply({ id: 'c', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '20.00' });
    l.apply({ id: 'a', type: 'AUTHORIZATION', account: 'A', booked: 1, value: 1, authId: 'approved', amount: '10.00' });
    l.apply({ id: 's2', type: 'SETTLEMENT', account: 'A', booked: 1, value: 1, authId: 'approved', amount: '11.00' });
    expect(l.balance('A', 1)).toBe(2000n);
    expect(l.entries).toHaveLength(3);
    expect(l.auths.get('approved')?.at(-1)?.state).toBe('APPROVED');
    expect(l.log).toHaveLength(3);
  });
  it('cannot change ledger history or authorization state through public snapshots', () => {
    const l = new Ledger({ A: 'AED' });
    l.apply({ id: 'c', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '100.00' });
    l.apply({ id: 'a', type: 'AUTHORIZATION', account: 'A', booked: 1, value: 1, authId: 'hold', amount: '20.00' });
    const entries = l.entries as unknown as { amount: bigint }[];
    entries[0].amount = 999999n;
    entries.splice(0);
    const auths = l.auths as unknown as Map<string, { state: string }[]>;
    auths.get('hold')![0].state = 'DECLINED';
    auths.clear();
    (l.log as string[]).push('fake error');
    expect(l.balance('A', 1)).toBe(10000n);
    expect(l.entries).toHaveLength(1);
    expect(l.auths.get('hold')?.at(-1)?.state).toBe('APPROVED');
    expect(l.log).toHaveLength(0);
    const close = l.closeDay(1);
    close.balances.A = -1n;
    expect(l.reports[0].balances.A).toBe(10000n);
  });

  it('retains the original hold when an ID is reused or settlement names another account', () => {
    const l = new Ledger({ A: 'AED', B: 'AED' });
    l.apply({ id: 'c', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '100.00' });
    l.apply({ id: 'a', type: 'AUTHORIZATION', account: 'A', booked: 1, value: 1, authId: 'shared', amount: '20.00' });
    l.apply({ id: 'dup', type: 'AUTHORIZATION', account: 'B', booked: 1, value: 1, authId: 'shared', amount: '1.00' });
    l.apply({ id: 'wrong', type: 'SETTLEMENT', account: 'B', booked: 1, value: 1, authId: 'shared', amount: '1.00' });
    expect(l.auths.get('shared')?.at(-1)?.state).toBe('APPROVED');
    expect(l.auths.get('shared')?.at(-1)?.account).toBe('A');
    expect(l.entries).toHaveLength(1);
    expect(l.log).toHaveLength(2);
  });

});
