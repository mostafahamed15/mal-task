# Ambiguities and decisions

- **Fee reversal:** a fee assessed on a day later made non-negative by a correction is offset by an append-only reversal at the next close. The contract chooses this policy; the review notes the brief does not explicitly prescribe a refund. If the same three assessments instead stood permanently, the final ACC-001 balance would be 390.00 before interest, and corrected-balance daily interest would total 0.93, giving 390.93 AED. The chosen policy yields 466.03 AED.
- **Fee timing:** reconcile at day close, not after each input. This makes the Day 5 pre-fee view observable but can approve an authorization before a pending fee is applied; test/limitation.test.ts demonstrates the trade-off.
- **Backdated E8 authorization:** before the Day 5 close, no pending fees have been recognized. Available is -155.00 - 0.00 holds - 90.00 = -245.00 AED, and Auth-B is declined. A calculation that includes the three not-yet-assessed fees would be -320.00.
- **Debit overdrafts:** DEBIT does not check available funds. Only authorizations reserve and check availability; the backdated E7 debit can make balances negative.
- **Interest basis:** use corrected balances after Day 6 close and before capitalization, including Day 6 without earning interest on the capitalization entry itself. The daily-close-as-known alternative gives 0.84 AED and 0.004 BHD rather than 1.03 AED and 0.008 BHD.
- **Equal instalments:** exact equality is impossible for 10.000 BHD across three minor-unit amounts. Preserve the total and put the extra unit on the first part.
- **Fee reinstatement:** if a reversed assessment later becomes due again, log the unsupported condition once per account/day and do not append a second assessment.
- **Fee currency:** the fee is AED 25.00. No FX policy is specified; a fee due on a BHD account throws and aborts replay. A failed close leaves all close changes unapplied.
- **Authorization value date:** authorizations create no entry; available funds use the booked-day balance less current active holds.
- **Partial settlement:** a settlement at or below the hold is accepted and releases the whole hold, including the unused remainder.
- **Authorization identifiers:** IDs are global across accounts. An approved or declined authorization reserves its ID, and history is appended.
- **Reversal value date:** an explicit reversal must target an unreversed DEBIT on the same account and use its original value day. A correction is appended; the target is never removed.
- **Late events:** accept an event after its booked day has closed; do not rewind the clock and re-evaluate historical fees at the next close. As reported by the supplied review, E10 is booked Day 5 but arrives after E9 on Day 6.
- **Fee dates:** a fee or reversal entry is created during reconciliation at a close and value-dated to the assessed day. The entry records the value day, not a separate booking-day field.
- **Criterion 1 timing:** the -370.00 AED Day 2 amount is measured immediately before Day 5 fee reconciliation.
- **Criterion 6 and fees:** assessments remain visible as offsetting reversals, which are appended only at Day 6 close. Immediately after E9, before that close, fee reversals do not yet exist.
- **Errors:** unknown account, duplicate ID and invalid settlement or reversal are logged as rejections. Malformed amounts and unsupported BHD fees throw and abort the replay; a failed close does not publish partial fees or logs. Event IDs are reserved before amount parsing, so do not resume the same ledger after a malformed input.
