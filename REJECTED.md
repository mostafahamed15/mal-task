# Acceptance decisions and rejected approaches

| Criterion | Decision | Reason |
| --- | --- | --- |
| Day 2 is -370.00 AED at the end of Day 5 before fees | Accept | 1,200 - 950 - 620 = -370 before the close reconciles fees. |
| E7 causes exactly one fee, on Day 2 | Reject | The Day 2 fee carries forward; Days 4 and 5 are also negative pre-fee, yielding three assessments. |
| Auth-A settlement accepted | Accept | The 185.00 settlement is within its approved 200.00 hold. |
| Unknown authorization settlement rejected without a debit | Accept | E6 produces a rejection and no entry. |
| An approved Auth-B hold reduces available funds, not ledger balance | Accept as a rule | In the reference stream Auth-B is declined and reserves no funds. |
| After E9 all balances and fees return to pre-E7 values | Reject as worded | Fee assessments remain visible as offsetting reversals, which are appended only at Day 6 close; balances and net fees return after reconciliation. |
| Each of three instalments is 3.334 BHD | Reject | Their sum is 10.002 BHD, not 10.000 BHD. |
| Discard the remainder between rounded daily accruals and capitalization | Reject | Capitalization is defined as the sum of rounded daily accruals; there is no such remainder. |

The v2 approach recorded in the supplied contract reconciled fees during each input batch and needed intra-batch views to express criterion 1. It was abandoned in favor of day-close reconciliation. Interest on balances as known at each close was also considered and rejected; see AMBIGUITIES.md.

The source contract suggests half-even would round daily interest on 465.00 AED to 0.18. This is incorrect: 465.00 / 2,500 = 0.186, which rounds to 0.19 under both half-up and half-even. A genuine tie is 462.50 / 2,500 = 0.185; half-even yields 0.18 and half-up yields 0.19.
