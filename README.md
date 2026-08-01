# Live Wire Listing Studio

An evidence-first workflow for turning mixed batches of antique and vintage-item photographs into reviewable eBay listing drafts.

Live Wire Listing Studio groups related photographs, keeps thumbnails visible throughout review, captures seller-confirmed facts before writing prose, generates structured listing copy, and creates safe unpublished offers in the eBay Sandbox.

## MVP status

The complete guided workflow has been verified in production:

1. Load personal photographs or a built-in sample batch.
2. Review adaptive visual grouping and visible thumbnails.
3. Reassign photographs when the proposed boundary is wrong.
4. Confirm category, maker, model or title, condition, and testing notes.
5. Generate an eBay title and guide-compliant description.
6. Create and verify an unpublished eBay Sandbox offer.

The production deployment is private. A demonstration can be provided on request.

## Product principles

- **Facts before prose:** seller-confirmed facts remain distinct from generated description text.
- **Human review at consequential boundaries:** visual grouping suggests; the seller decides.
- **Evidence stays visible:** each proposed item retains its associated image thumbnails.
- **Expectation setting over hype:** condition language includes testing limits, photographed-detail disclaimers, and conservative claims.
- **Safe marketplace integration:** the MVP uses eBay Sandbox and does not publish live listings.
- **Local continuity:** the working batch, corrections, facts, and drafts persist on the current device.

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

The current marketplace workflow creates **unpublished Sandbox offers only**. Publishing a real listing is intentionally outside the MVP and should require a separate, explicit approval step.

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

- Durable multi-device batch storage
- Stronger vision, OCR, duplicate detection, and confidence scoring
- Evidence-linked fact provenance and contradiction review
- eBay taxonomy suggestions and item-specific mapping
- Image upload and richer unpublished-draft management
- Explicitly gated production publishing
- Watched-folder intake and exception-based batch automation

## Project story

This project grew from a practical antiques-listing problem: one photo folder can contain several visually similar manuals, radios, or pieces of equipment, but rigid image counts and prose-first automation introduce costly mistakes. Live Wire instead treats grouping and factual identification as reviewable evidence problems, then automates the repetitive writing and marketplace setup around those decisions.

Built collaboratively by Mark Beebe and OpenAI Codex.
