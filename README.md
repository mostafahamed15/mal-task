# Account Ledger PoC

A small, in-memory TypeScript ledger that replays ten reference events across six days. It has no runtime dependencies, persistence, database or web layer. Requires Node.js 22 or later.

```sh
npm install
npm run replay
npm test
npm run typecheck
npm run test:limitation
```

The final command is deliberately expected to fail. It demonstrates that an authorization can be approved before a pending fee caused by a backdated debit is recognized at day close. It is excluded from the normal test suite.

The replay prints a block for each close: account balances as known at that close, new fee assessments and reversals (labeled with their value day), current authorization states, and errors since the previous close. The final table uses balances corrected as of the end of Day 6 and shows rounded daily interest and capitalization. The final balances are 466.03 AED and 10.008 BHD.

Money uses bigint minor units; no floating-point currency arithmetic is used. See NUMBERS.md, AMBIGUITIES.md, REJECTED.md and PART2.md for figures, choices, rejected criteria and operational limits.
