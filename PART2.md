# Part 2: Scale, value dates and scope

## At 100 times the reference volume

Every balance scans the entries. For A accounts, N entries, and a close on day d, reconciliation scans the entries repeatedly for each account/day, so a close is O(A * d * N). Multiple closes repeat that work; the growing entries and log are unbounded. Active holds are also scanned during authorization. At 100 times the stream, latency and memory become concerns, even with the six-day horizon fixed.

A modest next step is per-account, per-value-day totals, with cached cumulative totals invalidated from the earliest value day touched by a backdated posting. Keep the append-only source entries and rebuild or reconcile the cache from them. Durable storage, indexed access, bounded logs and concurrency control would still be needed in a real service.

## Value dates and controls

A late value date changes historical balances, fees, interest and potentially statements already given to a customer. The implementation exposes a daily close as known at the time and a corrected final view, but it does not issue restated statements or retain durable records. A production design needs traceable adjustments, a policy for customer communication and corrected statements, interest recalculation, durable history and retention controls.

For context, the [CBUAE Consumer Protection Standards, Article 2](https://rulebook.centralbank.ae/en/rulebook/article-2-disclosure-and-transparency) include requirements for transaction statements and disclosures, while the [Consumer Protection Standards](https://rulebook.centralbank.ae/en/rulebook/consumer-protection-standards) include consumer-record retention provisions. These references do not establish that this PoC is compliant or specify a universal backdating window. Applicability and retention periods require review for the actual institution and product.

A practical control is a configured backdating window with maker-checker approval for exceptions, recorded reason, actor, original booking and value dates, and audit trail. This is a proposed control, not a rule implemented here.

## Authorization lifecycle

An approved hold can end in a settlement (the full remaining hold is released here), expiry, merchant void or cancellation, or account closure. A request can be declined at authorization. Partial capture is accepted within the hold but the unused remainder is released; multiple captures are not supported. Over-capture and settlement without an approved matching authorization are rejected. Expiry, void, cancellation and closure are not modeled, so an approved hold without a settlement remains active indefinitely.

## Deliberate cuts

No persistence, concurrency, double-entry accounting, FX, multi-capture, authorization expiry, or production controls. A reversed fee cannot be reinstated. Interest is calculated once at the end of the six-day window. Fees are reconciled only at close, so pending backdated fees are not considered in an intervening authorization. Logs and entries remain in memory for the life of the process.
