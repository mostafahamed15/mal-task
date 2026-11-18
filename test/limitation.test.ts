import { expect, it } from 'vitest';
import { Ledger } from '../src/ledger.js';

// Deliberately fails: the backdated debit has created a pending fee, but fees
// are reconciled only at close. Recognizing pending fees before authorization
// (or reconciling on each backdated entry) would make this expectation pass.
it('documents that a pending backdated fee should reduce available funds', () => {
  const l = new Ledger({ A: 'AED' });
  l.apply({ id: 'c1', type: 'CREDIT', account: 'A', booked: 1, value: 1, amount: '100.00' });
  l.closeDay(1);
  l.apply({ id: 'c2', type: 'CREDIT', account: 'A', booked: 2, value: 2, amount: '20.00' });
  l.apply({ id: 'd', type: 'DEBIT', account: 'A', booked: 2, value: 1, amount: '110.00' });
  l.apply({ id: 'a', type: 'AUTHORIZATION', account: 'A', booked: 2, value: 2, authId: 'hold', amount: '10.00' });
  expect(l.auths.get('hold')?.at(-1)?.state).toBe('DECLINED');
});
