# Numbers and rounding

The supplied v3 contract states the values below. The original brief was not available alongside it, so classifications as brief-given versus chosen are based on the contract, not independent verification.

| Value | Origin and reason |
| --- | --- |
| AED 25.00 overdraft fee | Brief figure as represented in the contract; assessed for each negative pre-fee day. |
| 0.04% daily interest = 1/2500 | Brief figure as represented in the contract; division by 2500 avoids floating point. |
| AED 2 and BHD 3 decimal places | Currency precision specified by the contract; amounts beyond the currency precision are rejected. |
| Half-up daily rounding | Contract choice: 46,500 minor units / 2,500 = 18.6, yielding 19; 3,750 / 2,500 = 1.5, yielding 2. Half-even is a different policy, not used here (for example 0.185 would become 0.18 under half-even). |
| 1,250 minor-unit numerator offset | Exactly half of the 2,500 divisor: (positive minor balance + 1,250) / 2,500 implements half-up integer division. |
| Days 1 through 6 | Reference window specified by the contract. |
| Three instalments for 10.000 BHD | Reference input from the contract. The integer remainder goes to the earliest parts: 3.334, 3.333, 3.333. Three times 3.334 would create 0.002 BHD. |
| E6 amount 10.00 AED | Assumed for this implementation: the supplied contract specifies an unknown Auth-Z but not its settlement amount. It is rejected before any posting, so this assumption does not affect balances. |

Capitalization is the exact sum of rounded daily accruals. No separate remainder exists to discard. Negative daily balances earn zero interest.
