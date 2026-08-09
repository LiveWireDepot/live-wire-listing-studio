# Production Validation

## What this document does and does not prove

This is a redacted summary of observed private Production reconciliation reports. It demonstrates that the workflow produced and reconciled marketplace results. It does not expose source photos, seller information, credentials, offer IDs, listing IDs, prices, or raw approval hashes.

It also does not claim that every future item will be categorized, priced, or described correctly without seller review.

## Final reconciliation evidence

| Private batch report | Individual reconciled results | Unique remote offer identities | Unique live listing identities | Final exceptions | Recorded manifest differences |
|---|---:|---:|---:|---:|---:|
| Photos2 | 74 | 74 | 74 | 0 | 0 |
| Photos3 | 16 | 16 | 16 | 0 | 0 |
| Photos4 | 58 | 58 | 58 | 0 | 0 |
| **Total** | **148** | **148** | **148** | **0** | **0** |

The reports record `LIVE_RECONCILED` outcomes: the application read remote marketplace state after publishing and compared it with the approved listing intent. The raw reports are intentionally excluded from the public repository.

## What live testing taught us

- A category must be a leaf category before it can accept a listing.
- An otherwise reasonable condition can be invalid for that selected category.
- Shipping package values can block an offer before publication.
- Best Offer requires its own explicit configuration and should not be confused with publish authorization.
- Quantities must be reviewed alongside their associated photos before a batch is sealed.
- A remote success can occur even when a local request times out; the correct response is reconciliation, not blind retry.
- A workflow can be technically safe and still be unusable if the seller cannot see the next action.

## Release discipline

The production path separates preparation from publication:

1. Create or recover an unpublished offer.
2. Read the remote offer back and compare it with the intended record.
3. Run eBay preflight for category, condition, policies, package, photos, price, and required specifics.
4. Save an immutable approval manifest and review fees.
5. Require exact final approval for a canary or approved batch.
6. Publish sequentially and reconcile remote state.

No state-changing marketplace request is blindly retried. Existing live listings are not modified during recovery.

