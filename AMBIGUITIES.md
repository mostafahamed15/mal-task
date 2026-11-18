# Ambiguities and decisions

- **Fee timing:** reconcile at day close, not during every input. This makes the Day 5 pre-fee view observable but can approve an authorization before a pending fee is applied; test/limitation.test.ts demonstrates the trade-off.
- **Interest basis:** use corrected balances after Day 6 close and before capitalization. The daily-close-as-known alternative gives 0.84 AED and 0.004 BHD rather than 1.03 AED and 0.008 BHD. Corrections do not deprive the customer of interest.
- **Equal instalments:** exact equality is impossible for 10.000 BHD across three minor-unit amounts. Preserve the total and put the extra unit on the first part.
- **Fee reinstatement:** if a reversed assessment later becomes due again, log the unsupported condition once per account/day and do not append a second assessment.
- **Fee currency:** the fee is AED 25.00. There is no FX policy; a fee due on a BHD account throws.
- **Authorization value date:** it does not create an entry; available funds use balance at the booked day less current active holds.
- **Late events:** accept an event even if its booked day has closed; re-evaluate historical fees on the next close. The replay stream itself is ordered by booked day.
- **Authorization identifiers:** a declined authorization reserves its ID, as do approved authorizations. Each state transition is appended.
- **Criterion 1 timing:** the -370.00 AED Day 2 amount is measured at the end of Day 5 immediately before fee reconciliation, not after fees.
- **Criterion 6 and fees:** append-only fee assessments remain in history, offset by reversal entries at Day 6 close. Immediately after E9, before that close, fee reversals have not yet been appended.
- **E6 settlement amount:** the contract does not give it. The typed reference stream uses 10.00 AED; any valid amount is rejected because Auth-Z does not exist.
