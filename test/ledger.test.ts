import { describe, expect, it } from 'vitest';
import { Ledger } from '../src/ledger.js';
import { run } from '../src/run.js';
import { accounts, stream } from '../src/stream.js';

describe('reference replay', () => {
  it('matches daily balances, historical decisions, fees and corrected interest', () => {
    const ledger = new Ledger(accounts);
    let preFeeDay2 = 0n;
    run(ledger, stream, { beforeClose(day, state) {
      if (day === 5) preFeeDay2 = state.balance('ACC-001', 2);
    } });
    expect(stream.find(e => e.id === 'E6')).toMatchObject({ amount: '180.00' });
    expect(stream.find(e => e.id === 'E10')).toMatchObject({ booked: 5, value: 5 });
    expect(stream.findIndex(e => e.id === 'E9')).toBeLessThan(stream.findIndex(e => e.id === 'E10'));
    expect(preFeeDay2).toBe(-37000n);
    expect(ledger.reports.map(r => r.balances['ACC-001'])).toEqual([25000n, 25000n, 65000n, 46500n, -23000n, 46500n]);
    expect(ledger.reports.map(r => r.balances['ACC-002'])).toEqual([0n, 0n, 0n, 0n, 0n, 10000n]);
    expect(ledger.reports[3].errors.some(e => e.startsWith('SETTLEMENT_REJECTED: E6'))).toBe(true);
    expect(ledger.entries.some(e => e.source === 'E6')).toBe(false);
    expect(ledger.auths.get('Auth-A')?.map(a => a.state)).toEqual(['APPROVED', 'SETTLED']);
    expect(ledger.auths.get('Auth-B')?.at(-1)?.state).toBe('DECLINED');
    expect(ledger.entries.filter(e => e.source === 'FEE').map(e => e.feeDay)).toEqual([2, 4, 5]);
    expect(ledger.entries.filter(e => e.source === 'FEE_REVERSAL').map(e => e.feeDay)).toEqual([2, 4, 5]);
    expect(ledger.entries.filter(e => e.feeDay).reduce((n, e) => n + e.amount, 0n)).toBe(0n);
    expect(ledger.entries.filter(e => e.source === 'E10').map(e => e.amount)).toEqual([3334n, 3333n, 3333n]);
    const count = ledger.entries.length;
    ledger.closeDay(6);
    expect(ledger.entries).toHaveLength(count);
    const interest = ledger.finalize();
    expect(interest[0].balances).toEqual([25000n, 25000n, 65000n, 46500n, 46500n, 46500n]);
    expect(interest[0].accruals).toEqual([10n, 10n, 26n, 19n, 19n, 19n]);
    expect(interest[0].total).toBe(103n);
    expect(interest[1].accruals).toEqual([0n, 0n, 0n, 0n, 4n, 4n]);
    expect(interest[1].total).toBe(8n);
    expect(ledger.balance('ACC-001', 6)).toBe(46603n);
    expect(ledger.balance('ACC-002', 6)).toBe(10008n);
  });
  it('refuses fees in a currency without an FX rule', () => {
    const l = new Ledger({ B: 'BHD' });
    l.apply({ id: 'd', type: 'DEBIT', account: 'B', booked: 1, value: 1, amount: '1.000' });
    expect(() => l.closeDay(1)).toThrow('Fee currency unsupported');
  });
  it('logs an unsupported fee reinstatement once without adding an assessment', () => {
    const l = new Ledger({ A: 'AED' });
    l.apply({ id: 'd', type: 'DEBIT', account: 'A', booked: 1, value: 1, amount: '1.00' });
    l.closeDay(1);
    l.apply({ id: 'c', type: 'CREDIT', account: 'A', booked: 2, value: 1, amount: '2.00' });
    l.closeDay(2);
    l.apply({ id: 'd2', type: 'DEBIT', account: 'A', booked: 3, value: 1, amount: '2.00' });
    l.closeDay(3);
    l.closeDay(3);
    expect(l.log.filter(x => x.includes('FEE_REINSTATEMENT_UNSUPPORTED: A day 1'))).toHaveLength(1);
    expect(l.entries.filter(x => x.source === 'FEE' && x.feeDay === 1)).toHaveLength(1);
  });
  it('does not mistake an event named FEE for a fee entry', () => {
    const l = new Ledger({ A: 'AED' });
    l.apply({ id: 'FEE', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '10.00' });
    l.closeDay(1);
    expect(l.entries.filter(e => e.feeDay)).toHaveLength(0);
  });
});
