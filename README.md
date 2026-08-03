# Live Wire Listing Studio

An evidence-first production workflow for turning mixed batches of antique and vintage-item photographs into prepared, reviewable, and deliberately published eBay listings.

Live Wire Listing Studio groups related photographs, keeps thumbnails visible throughout review, captures seller-confirmed facts before writing prose, generates structured listing copy, prepares category-specific marketplace data, creates unpublished Production offers, validates them against eBay, and requires final human approval before live publication.

**Portfolio case study:** [From Listing Chore to Seller Operating System](docs/PRODUCT_CASE_STUDY.md)

**Portfolio talk track:** [How to present the project in a résumé, interview, or client conversation](docs/PORTFOLIO_TALK_TRACK.md)

## Current status

The private Production application now supports:

1. Load and visually group personal photographs.
2. Confirm evidence-backed facts and generate listing copy.
3. Prepare items by resolving an eBay leaf category, allowed condition, required item specifics, policies, package data, images, and approved price.
4. Create a safe unpublished Production offer.
5. Run full remote preflight and review the exact listing and fees.
6. Publish only after explicit final approval, then reconcile the live listing.

A measured multi-item Production canary is the next milestone. The current throughput target is 40–50 prepared listings in a short supervised batch session; that target has not yet been validated.
## Product principles

- **Facts before prose:** seller-confirmed facts remain distinct from generated description text.
- **Human review at consequential boundaries:** visual grouping suggests; the seller decides.
- **Evidence stays visible:** each proposed item retains its associated image thumbnails.
- **Expectation setting over hype:** condition language includes testing limits, photographed-detail disclaimers, and conservative claims.
- **Safe marketplace integration:** Production publishing requires preparation, an unpublished offer, full preflight, an immutable manifest, fee review, and explicit final approval.
- **Durable continuity:** Production items, photographs, remote identities, operations, and publication manifests persist server-side, with device-local continuity for active work.

## Key features

- Adaptive photo grouping without a preset images-per-item count
- Manual photo reassignment and re-grouping
- Device-local workspace persistence with IndexedDB
- Visible per-item thumbnail review
- Structured category, maker, model, and condition fields
- Photo-assisted listing generation with deterministic formatting rules
- Separate editable eBay title and description fields
- One-time eBay Sandbox seller setup for policies and inventory location
- Unpublished Sandbox inventory-offer creation
- Guided six-check MVP test bench
- Responsive warm-charcoal dark mode with a saved preference

## Technology

- TypeScript, React 19, and Next.js-compatible routing
- Vinext and Vite for Cloudflare Worker-compatible builds
- Cloudflare D1 with Drizzle ORM for OAuth token persistence
- eBay OAuth, Account API, and Inventory API Sandbox integration
- OpenAI-powered image and listing analysis
- IndexedDB for device-local working state
- Private deployment through OpenAI Sites

## Safety and privacy

Credentials are supplied only through hosted environment variables. They are not committed to this repository. OAuth access and refresh tokens are stored server-side; browser code never receives the eBay client secret.

The Production workflow can publish real listings only after an unpublished offer passes full preflight and the seller approves the exact immutable publication manifest. No batch action silently bypasses that final gate.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

```bash
npm install
npm run dev
```

On Windows PowerShell, set the Wrangler log path before running Vinext:

```powershell
$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"
npx.cmd vinext dev
```

Validate a production build:

```powershell
$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"
npx.cmd vinext build
```

## Hosted configuration

The eBay integration expects hosted environment values including:

- `EBAY_ENVIRONMENT`
- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_RUNAME`
- `EBAY_MARKETPLACE_ID`

Do not place credential values in source files, screenshots, issues, or commits.

## Roadmap

- Multi-user roles and broader cross-device batch management
- Stronger vision, OCR, duplicate detection, and confidence scoring
- Evidence-linked fact provenance and contradiction review
- Stronger taxonomy ranking and automatic item-specific mapping
- Image upload and richer unpublished-draft management
- Measured multi-item Production canary and throughput benchmarking
- Watched-folder intake and exception-based batch automation

## Project story

This project grew from a practical antiques-listing problem: one photo folder can contain several visually similar manuals, radios, or pieces of equipment, but rigid image counts and prose-first automation introduce costly mistakes. Live Wire instead treats grouping and factual identification as reviewable evidence problems, then automates the repetitive writing and marketplace setup around those decisions.

Built collaboratively by Mark Beebe and OpenAI Codex.
