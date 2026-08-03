# Live Wire Listing Studio — Portfolio Talk Track

## 30-second version

I designed Live Wire Listing Studio to turn a mixed batch of antique and vintage photographs into accurate, category-ready eBay listings. I brought the domain expertise, product direction, testing strategy, and human-in-the-loop rules, and I worked with OpenAI Codex as my engineering collaborator. The result is a private Production application that groups photographs, generates evidence-aware listing content, pulls category requirements, prepares unpublished offers, validates them against eBay, and requires explicit approval before publication.

## What I owned

- Product vision and prioritization
- Seller workflow and domain rules
- Human-in-the-loop and trust boundaries
- Listing-content standards and expectation-setting language
- Production acceptance testing
- Failure analysis and workflow redesign
- Portfolio narrative and roadmap

## Resume-ready bullets

- Designed and directed development of an evidence-first eBay listing application integrating photo analysis, structured content generation, category-specific requirements, OAuth, seller policies, unpublished offers, preflight validation, and deliberately gated Production publishing.
- Converted hands-on resale expertise into product rules that distinguish observed evidence, seller-confirmed facts, and inference—reducing the risk of unsupported condition, identity, testing, and provenance claims.
- Identified a major workflow usability issue during Production testing and redesigned five disconnected marketplace stages into a single exception-driven “Next eBay action” orchestration.
- Established safety requirements for immutable publication manifests, explicit price approval, category and condition validation, duplicate-operation prevention, timeout reconciliation, and remote-state recovery.
- Led iterative product testing across eBay Sandbox and Production, turning real API failures and seller pain points into reusable architecture instead of isolated patches.
- Defined a measurable throughput goal of 40–50 prepared listings in a short supervised batch session while preserving human approval at consequential decisions; production benchmarking is the next milestone.

## What was distinctive about my collaboration style

### I supplied the missing domain model

I did not ask for a generic “AI eBay lister.” I explained how an experienced seller evaluates photographs, condition, completeness, shipping, pricing, offers, and customer expectations. That domain model shaped both the content contract and the system architecture.

### I tested the experience, not merely the feature list

When buttons technically existed but the path to publication was unclear, I did not accept “working as designed.” I called out that the workflow felt disjointed and articulated a better push-pull model: establish the category, retrieve its requirements, fill supported fields, request exceptions, and push back a complete offer.

### I challenged assumptions early

I questioned uniform pricing, automatic package estimates, Media Mail assumptions, FedEx tradeoffs, Best Offer behavior, category validity, item condition, revision support, and whether batch actions were truly batchable. Each challenge prevented the product from quietly encoding a poor operational assumption.

### I balanced ambition with responsibility

I consistently pushed for high throughput while refusing to sacrifice professionalism, build quality, accurate condition descriptions, or final human control. The goal was not automation for its own sake; it was trustworthy leverage.

### I made customer trust a design requirement

I specified that descriptions should acknowledge the limits of photographed inspection, disclose visible flaws, encourage buyers to review all images, and never turn uncertain evidence into confident claims. That is product thinking grounded in reputation and long-term customer value.

### I collaborated without pretending to know everything

I was candid about where I wanted engineering and UI/UX guidance, gave my collaborator room to propose better solutions, and still remained decisive about the real-world outcome. That combination—curiosity, trust, direct feedback, and ownership—kept the work moving.

## Interview answer: “Tell me about a product decision you changed”

During Production testing, the application had all of the required safety stages, but each stage exposed a different button and later controls appeared only after earlier remote objects existed. It was technically correct and operationally confusing. I recognized that the interface was reflecting the API rather than the seller’s job.

I reframed the workflow as one orchestration: classify the item, retrieve category requirements, fill evidence-supported fields, surface only exceptions, create an unpublished offer, validate it, and request final approval. We preserved the safety gates but introduced one persistent next-action panel. That decision made the workflow easier to understand without weakening marketplace protections.

## Client-facing version

I am good at turning an experienced operator’s unwritten judgment into a practical software workflow. I can identify which decisions should be automated, which require human review, and where a technically functional system still creates unnecessary work. I work well with AI-assisted engineering because I provide strong domain context, test real outcomes, challenge weak assumptions, and keep the project focused on measurable operational value.

## Evidence to show

- The [product case study](PRODUCT_CASE_STUDY.md)
- The Mermaid workflow showing the category requirement push-pull loop
- Production screenshots demonstrating photo grouping and the Next eBay action panel
- The automated test suite and migration history
- Commit history showing the progression from Sandbox prototype to durable Production workflow
- A future timed multi-item canary report with throughput, exception rate, and accuracy results
