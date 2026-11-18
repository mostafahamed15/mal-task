import type { Event } from './ledger.js';
import type { Currency } from './money.js';

export const accounts: Record<string, Currency> = { 'ACC-001': 'AED', 'ACC-002': 'BHD' };
export const stream: Event[] = [
  { id: 'E1', type: 'CREDIT', account: 'ACC-001', booked: 1, value: 1, amount: '1,200.00' },
  { id: 'E2', type: 'DEBIT', account: 'ACC-001', booked: 1, value: 1, amount: '950.00' },
  { id: 'E3', type: 'AUTHORIZATION', account: 'ACC-001', booked: 2, value: 2, authId: 'Auth-A', amount: '200.00' },
  { id: 'E4', type: 'CREDIT', account: 'ACC-001', booked: 3, value: 3, amount: '400.00' },
  { id: 'E5', type: 'SETTLEMENT', account: 'ACC-001', booked: 4, value: 4, authId: 'Auth-A', amount: '185.00' },
  { id: 'E6', type: 'SETTLEMENT', account: 'ACC-001', booked: 4, value: 4, authId: 'Auth-Z', amount: '10.00' },
  { id: 'E7', type: 'DEBIT', account: 'ACC-001', booked: 5, value: 2, amount: '620.00' },
  { id: 'E8', type: 'AUTHORIZATION', account: 'ACC-001', booked: 5, value: 5, authId: 'Auth-B', amount: '90.00' },
  { id: 'E9', type: 'REVERSAL', account: 'ACC-001', booked: 6, value: 2, target: 'E7' },
  { id: 'E10', type: 'INSTALMENT_CREDIT', account: 'ACC-002', booked: 6, value: 5, amount: '10.000', count: 3 },
];
