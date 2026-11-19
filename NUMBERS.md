# Numbers and rounding

The supplied v3 architecture contract states the constants below. The later review reports that the brief sets E6 to 180.00 AED and books E10 on Day 5; the original brief itself was not supplied for this review, so those two details are attributed to the review rather than independently verified.

| Value | Origin, choice and why not half |
| --- | --- |
| AED 25.00 fee (2,500 fils) | Given by the contract as a brief figure. Halving it would change the specified fee, not implement it. |
| 0.04% daily interest = 1/2,500 | Given by the contract as a brief figure. Half the rate, 0.02%, underpays relative to that specification. The divisor is the exact reciprocal, not an independent tuning parameter. |
| AED 2 and BHD 3 decimal places | Currency precisions specified by the contract. Reducing precision would lose valid minor units and would not implement the specified currencies. |
| Half-up daily rounding | Chosen policy. AED 465.00 / 2,500 = 0.186, which rounds to 0.19. Both half-up and half-even round that example to 0.19; 462.50 / 2,500 = 0.185 is a genuine tie: half-up gives 0.19 and half-even gives 0.18. |
| 1,250 numerator offset | Half of the 2,500 divisor implements half-up integer rounding. Halving the offset to 625 would round up only from a fraction of 0.75, underpaying values between 0.5 and 0.75. |
| Days 1 through 6 | The reference window in the contract; using only three days omits the last three days, including the correction. |
| Three instalments | Reference count in the contract; half the count is not the specified split. 10.000 BHD splits into 3.334, 3.333 and 3.333. |
| Remainder to earliest parts | A deterministic choice: allocate one minor unit to each of the first remainder parts. Assigning the extra units to the last parts would also preserve the total but is a different policy. |
| E6 amount: 180.00 AED | Reported by the supplied review as the brief input. E6 is rejected because Auth-Z is unknown, so its amount does not affect the balance. |

Capitalization is exactly the sum of rounded daily accruals. No separate remainder exists to discard. Negative balances earn zero interest.
