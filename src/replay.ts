import { Ledger, type Day } from './ledger.js';
import { format } from './money.js';
import { accounts, stream } from './stream.js';

const ledger = new Ledger(accounts);
function close(day: Day): void {
  const report = ledger.closeDay(day);
  console.log('\nDay ' + day + ' close');
  for (const [account, balance] of Object.entries(report.balances)) console.log('  ' + account + ': ' + format(balance, accounts[account]) + ' ' + accounts[account]);
  for (const fee of report.fees) console.log('  ' + fee.source + ' ' + fee.account + ' day ' + fee.feeDay + ': ' + format(fee.amount, accounts[fee.account]));
  for (const [id, auth] of Object.entries(report.authorizations)) console.log('  ' + id + ': ' + auth.state);
  for (const error of report.errors) console.log('  ' + error);
}
for (const event of stream) {
  while (ledger.closed < event.booked - 1) close((ledger.closed + 1) as Day);
  ledger.apply(event);
}
while (ledger.closed < 6) close((ledger.closed + 1) as Day);
const interest = ledger.finalize();
console.log('\nCorrected balances and daily interest (before capitalization)');
for (const item of interest) {
  const currency = accounts[item.account];
  console.log('\n' + item.account + ' (' + currency + ')');
  for (let i = 0; i < 6; i++) console.log('  Day ' + (i + 1) + ': balance ' + format(item.balances[i], currency) + ', interest ' + format(item.accruals[i], currency));
  console.log('  Capitalized: ' + format(item.total, currency) + '; final: ' + format(ledger.balance(item.account, 6), currency));
}
