# Live Wire Listing Studio: Portfolio Talk Track

## 30-second version

I designed Live Wire Listing Studio to turn mixed batches of antique and vintage photographs into evidence-aware, category-ready eBay listings. I supplied the resale-domain model, product direction, testing strategy, human-review rules, and Production acceptance criteria; I worked with OpenAI Codex as an engineering collaborator. The result is a private Production workflow that groups photos, generates structured listing content, pulls category requirements, prepares unpublished offers, validates them remotely, and requires explicit approval before publication.

## Resume-ready bullets

- Designed and directed an evidence-first eBay listing workflow integrating photo grouping, structured content generation, category-specific requirements, OAuth, seller policies, unpublished offers, preflight validation, immutable approval manifests, and Production reconciliation.
- Converted hands-on resale expertise into product rules that distinguish observed evidence, seller-confirmed facts, and inference, reducing unsupported claims about condition, identity, testing, completeness, or provenance.
- Reframed a confusing multi-step marketplace interface as a single exception-driven next-action workflow after Production testing revealed that technical correctness alone did not create operational clarity.
- Established safeguards for exact price approval, category and condition validation, duplicate-operation prevention, timeout recovery, and remote-state reconciliation.
- Designed a cost-aware AI routing strategy: deterministic local/API work first, Luna for routine generation, Terra for approved evidence exceptions, and Sol only for engineering or high-risk edge cases.
- Used multiple AI agents for bounded parallel research and review while retaining ownership of product decisions, scope, and live-publication acceptance.

## What was distinctive about the work

### I supplied the missing domain model

I did not ask for a generic AI lister. I explained how an experienced seller evaluates condition, completeness, photographs, shipping, pricing, offers, and customer expectations. Those details shaped both the content rules and the technical workflow.

### I tested the experience, not just the feature list

When controls existed but the path to publication was confusing, I did not accept "working as designed." I identified the mismatch, articulated the category requirements pull-push loop, and directed the redesign around the seller's actual job.

### I treated AI cost as a product decision

The project encountered an intelligence-budget crunch. Rather than applying the strongest model everywhere, I helped define where cheap, local, and deterministic processing was sufficient; where low-cost inference was appropriate; and where escalation was worth the cost. The result is a measured cost-control design, not an assumption that more AI is always better.

### I preserved human accountability

Automation speeds the repetitive parts. It does not silently decide a questionable condition, price, quantity, shipping exception, or live publication. I kept final accountability with the seller and required remote verification after consequential marketplace actions.

## Client-facing version

I turn an experienced operator's unwritten judgment into a practical workflow. I identify what can be automated, what must remain reviewable, where a technically working system still creates friction, and how to introduce AI without hiding cost, evidence, or accountability.

