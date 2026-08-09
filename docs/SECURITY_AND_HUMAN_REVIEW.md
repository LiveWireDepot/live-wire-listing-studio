# Security and Human Review

## Public-repository boundary

This repository intentionally excludes:

- API keys, client secrets, access tokens, refresh tokens, and deployment credentials;
- raw photo batches and review sheets;
- seller-specific rescue reports, remote identifiers, and approval hashes;
- customer information and eBay account data.

Hosted runtime configuration holds credentials. The browser does not receive the eBay client secret.

## Human review boundary

The application may propose facts and listing copy. It does not treat a model output as proof of authenticity, completeness, testing, compatibility, hidden condition, measurements, provenance, or market value.

The seller remains responsible for:

- condition and test status;
- uncertain maker, model, edition, quantity, completeness, and compatibility claims;
- price approval and shipping exceptions;
- accepting or changing suggested item specifics;
- final authorization to publish a live listing.

## Marketplace safety boundary

Live publication requires a prepared unpublished offer, a successful preflight, an immutable manifest, and exact final approval. On a lost response or ambiguous mutation, the workflow reads remote state before it considers another action. It does not blindly retry state-changing eBay calls.

## External-model boundary

OpenAI generation is used for structured draft content. Optional OpenRouter experimentation is separate, consented, and non-publishing until it passes a defined quality and privacy benchmark. A cheaper endpoint is not a reason to reduce evidence standards or privacy safeguards.

## Known limitations

- Photo analysis is provisional and must be reviewed when evidence is incomplete or contradictory.
- Active marketplace asking prices are not treated as realized-sale evidence.
- This owner-operated build is not yet a multi-tenant commercial service.
- The public validation summary is aggregate evidence; raw operational records remain private.

