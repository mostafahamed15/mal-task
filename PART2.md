# Part 2: Scale, value dates and scope

## At 100 times the reference volume

Every balance scans the entries. For A accounts, N entries, and a close on day d, reconciliation scans the entries repeatedly for each account/day, so a close is O(A * d * N). Multiple closes repeat that work; the growing entries and log are unbounded. Active holds are also scanned during authorization. At 100 times the stream, day close is the first likely latency bottleneck: it repeatedly scans the growing entries for every account and historical day. This is a complexity-based expectation, not a benchmark. Entries and log also grow without bound and create a memory risk.

A modest next step is per-account, per-value-day totals, with cached cumulative totals invalidated from the earliest value day touched by a backdated posting. Keep the append-only source entries and rebuild or reconcile the cache from them. Durable storage, indexed access, bounded logs and concurrency control would still be needed in a real service.

## Value dates and controls

A late value date changes historical balances, fees, interest and potentially statements already given to a customer. The implementation exposes a daily close as known at the time and a corrected final view, but it does not issue restated statements or retain durable records. A production design needs traceable adjustments, a policy for customer communication and corrected statements, interest recalculation, durable history and retention controls.

For context, the [CBUAE Consumer Protection Standards, Article 2](https://rulebook.centralbank.ae/en/rulebook/article-2-disclosure-and-transparency) include requirements for transaction statements and disclosures, while the [Consumer Protection Standards](https://rulebook.centralbank.ae/en/rulebook/consumer-protection-standards) include consumer-record retention provisions. These references do not establish that this PoC is compliant or specify a universal backdating window. Applicability and retention periods require review for the actual institution and product.

A practical control is a configured backdating window with maker-checker approval for exceptions, recorded reason, actor, original booking and value dates, and audit trail. This is a proposed control, not a rule implemented here.

## Authorization lifecycle

| Scenario | Current behavior | Production behavior or risk |
| --- | --- | --- |
| Declined at request | Record DECLINED, reserve the ID, create no hold or entry. Auth-B is declined in the reference stream. | Make the decline observable and do not reserve funds. |
| Approved but never settled | The hold remains active indefinitely. This is possible for an approved authorization; it does not happen to the declined Auth-B in the reference stream. | Expire or otherwise resolve the hold according to the applicable network and product rules; otherwise funds remain unnecessarily unavailable. |
| Over-capture | Reject; no debit is posted and the authorization stays APPROVED. | Handle any permitted tolerance under explicit network and product rules, or reject and retain the original hold until resolved. |
| Settlement on another account | Reject; no debit is posted and the original authorization stays APPROVED. | Match settlement to the correct account and authorization, and handle reconciliation errors. |
| Duplicate authorization ID | Reject the later event, including across accounts; the original state is unchanged. | Enforce the chosen ID scope durably and handle retries consistently. |
| Expiry | Not modeled. | Release the remaining hold at the applicable expiry and retain history. |
| Merchant void or cancellation | Not modeled. | Verify the request and release the relevant hold, retaining an audit trail. |
| Account closure | Not modeled. | Resolve or release outstanding holds under the account and network rules before closure. |
| Partial capture | Accept at or below the hold and release the entire remainder. | Support any product-specific multiple captures and release policy. |
| Unknown or already settled authorization | Reject settlement with no debit. | Reconcile missing or duplicate network messages under an explicit policy. |

The production actions above are design recommendations, not claims that this PoC implements them or that the supplied review specifies all network rules.

## Deliberate cuts and deferred risks

| Cut | Risk deferred |
| --- | --- |
| No persistence or durable audit trail | A process restart loses balances, holds, decisions and corrections. |
| No concurrency control | Parallel operations can race and overspend or duplicate postings. |
| Single-entry accounting | No balancing counter-entries or double-entry reconciliation; omissions can go undetected. |
| No FX | Cross-currency fees or transactions cannot be safely priced or reconciled. |
| No multi-capture, expiry, void or closure flows | Valid card-network lifecycles cannot be processed correctly; unresolved approved holds can leak. |
| Fee reinstatement unsupported | A fee made due again after its reversal is only logged, so fees can be understated. |
| Reconcile fees only at close | An authorization may be approved using funds needed for pending backdated fees. |
| Interest only at the end of the six-day window | No accurate periodic capitalization or mid-window interest statements. |
| In-memory full scans and unbounded logs | Latency grows with history and memory can exhaust. |
| No production access, approval and recovery controls | Unauthorized changes, undetected errors, and unrecoverable outages become possible. |
