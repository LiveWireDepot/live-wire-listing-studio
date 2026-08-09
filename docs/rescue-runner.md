# Live Wire rescue runner

This runner is the same-day recovery path for a frozen batch of eBay items. It is intentionally separate from the website UI and fails closed around every state-changing operation.

## Commands

```powershell
node scripts/live-wire-rescue.mjs audit --run=<run-directory> --remote=<remote-snapshot.json>
node scripts/live-wire-rescue.mjs prepare --run=<run-directory>
node scripts/live-wire-rescue.mjs verify --run=<run-directory> --remote=<remote-snapshot.json>
node scripts/live-wire-rescue.mjs publish-canary --run=<run-directory> --approval=<manifest-hash> --execute=true
node scripts/live-wire-rescue.mjs resume --run=<run-directory> --execute=true
```

`publish-canary` and `resume` remain locked until a production adapter is qualified against an authenticated export and remote audit. This is deliberate: a command name or flag alone must never bypass the canary gate.

## Source contract

`<run-directory>/source/items.json` contains an `items` array. Each item must include a stable SKU, ordered photo identifiers and SHA-256 digests, title, description, confirmed leaf category, allowed condition, approved price, package weight and dimensions, policy identifiers, inventory location, and resolved factual evidence.

Secrets and OAuth credentials never belong in the run directory. Secret-shaped fields are recursively redacted from state and event artifacts.

## Remote audit contract

The remote snapshot combines:

- Inventory API inventory and offers.
- Complete active and scheduled seller listings, including listings created through Seller Hub or older APIs.
- Read-back objects used for manifest reconciliation.

An unclear mutation result is never retried directly. The runner first searches remote state by stable SKU and known identifiers, then recovers one expected object, retries once only after proving absence, or blocks the item if the result is ambiguous.

## Evidence

Every run writes atomic per-item state, immutable hashed manifests, an append-only `events.jsonl`, and concise reports under `reports/`. A listing is complete only after its live result is reconciled with the approved manifest.
