# Live Wire Antiques Batch Listing Studio

## Authority and safety

`Mark_Beebe_eBay_Listing_Guide.docx` is the intended policy authority. The source file was not present in the shared workspace during this revision, so the prototype implements the guide requirements quoted in the referenced conversation plus Mark's explicit requirements in this task. When the DOCX is supplied, convert its rules into versioned policy fixtures and make conflicts fail closed.

No listing prose is generated until a human approves the canonical item record. The MVP creates copy-ready title and listing blocks plus an exportable draft package. eBay publishing, Inventory API credentials, and fast-track approval remain later phases.

## Pipeline

1. Ingest a mixed batch; retain EXIF timestamps, filename order, user notes, and original hashes.
2. Normalize orientation and create thumbnails, perceptual hashes, quality scores, OCR crops, object embeddings, background embeddings, and object-feature descriptors.
3. Detect exact duplicates by cryptographic hash and near-duplicates by perceptual hash plus embedding similarity. Keep all originals, but rank the sharpest, best-exposed, least-obstructed, most informative views for listing use.
4. Build a weighted evidence graph between photos. Positive edges combine object embeddings, OCR token agreement, visible labels, stable object features, background similarity, timestamps, and sequence. User hints are high-weight constraints. Contradictory serial/model text and clearly different physical features create negative edges.
5. Cluster the graph conservatively. Split clusters on strong contradictions. Accessories and manuals join only when photographed together or strongly linked. A group photograph is strong evidence for an intentional lot. Produce one proposed listing per cluster.
6. Send clusters below 85 confidence, or with a merge/split margin below 12 points, to human review. Never auto-merge on sequence or background alone.
7. Route each approved cluster to one expert: radios, telegraph, telephone, test equipment, service manuals, books/ephemera, parts/lots, military electronics, or general antiques.
8. Extract a canonical record. Every field stores value, provenance (`observed`, `user`, `researched`, `inference`), evidence references, confidence, contradictions, and review state.
9. Research only when identity is uncertain, a material listing fact is missing, or valuation/comps are requested. Prefer manufacturer literature, catalogs, primary documentation, and relevant sold evidence. Research never overwrites observed or user facts silently.
10. After human approval, generate the two-block listing, run deterministic QA, and export a draft. Any failed safety or truth validator blocks output.

## Grouping score

The baseline pair score is:

`0.42 visual object + 0.23 OCR/labels + 0.18 sequence/time + 0.10 object features + 0.07 background`

User `same item` and `separate item` hints act as must-link/cannot-link constraints. The score is calibrated by category and down-weighted when a signal is non-discriminative. Background and sequence may support but never independently prove a grouping. Quality ranking combines sharpness, exposure, resolution, obstruction, crop completeness, label readability, and view diversity.

## Confidence language

- 95–100: may be stated as fact only when direct evidence is uncontradicted.
- 80–94: qualify with `appears to be`, `attributed to`, `circa`, or equivalent conservative wording.
- Below 80: ask Mark, omit from customer-facing copy, or retain only as a visible review flag.

Confidence is field-specific. A high-confidence manufacturer does not raise the confidence of model, age, originality, completeness, testing status, or attribution.

## Canonical item record

Core entities: `Batch`, `PhotoAsset`, `PhotoSignal`, `PairEvidence`, `ItemCluster`, `ClusterDecision`, `CanonicalItem`, `FactClaim`, `ResearchCitation`, `ComparableSale`, `ListingDraft`, `ValidationResult`, and `Approval`.

Required `FactClaim` fields: stable ID, field name, value, normalized value, provenance, confidence, source photo/citation/user note, observed wording, contradictions, qualification rule, reviewer, and approval timestamp. The item record also stores category route, included items, excluded items, condition observations, testing status, dimensions, markings/OCR, intentional-lot rationale, selected views, duplicate views, and unresolved questions.

## Prompt contracts

All category experts receive the same evidence record and may not invent facts. They return structured JSON, not prose. Category additions:

- Radios: chassis/cabinet distinction, dial, tube complement, power and restoration claims.
- Telegraph: key/sounder/relay terminology, maker marks, binding posts, base, patents.
- Telephone: subset/type, transmitter/receiver, dial, wiring, maker and system compatibility.
- Test equipment: instrument class, model, probes/leads, calibration and electrical-safety caveats.
- Service manuals: exact title, model coverage, edition/revision, completeness, writing and page condition; apply the guide's service-manual note.
- Books/ephemera: title/author/publisher/date/edition, completeness, inscriptions, binding and page condition.
- Parts/lots: count, visible identifiers, photographed-together rationale, untested/unknown compatibility.
- Military electronics: nomenclature, contract/stock markings, demilitarization and safety caveats.
- General antiques: material, construction, markings, dimensions, function, attribution limits.

The listing writer uses ethical persuasion only: concrete sensory language, specificity, buyer perspective, collector identity, plausible future-use imagery, and fluent phrasing. It must reject false urgency, hype, scarcity claims, guarantees, unsupported rarity, emotional pressure, or invented provenance.

## Deterministic QA

The validator requires exactly two copy blocks, an eBay title of 80 characters or fewer, the guide's required section order and bullet conventions, a complete condition section, accurate testing language, photo-reference language, the applicable service-manual note, a closing paragraph, and separation of pricing/comps from listing copy. It rejects unresolved low-confidence claims, research without provenance, unsupported superlatives, false urgency/scarcity language, contradictions with the approved record, and output generated before approval.

## Delivery phases

- MVP: interactive batch upload, proposed clusters, duplicate/quality review, structured fact review, selective research/comps panel, approval gate, listing preview, copy/export.
- Next: real vision/OCR workers, durable batch storage, evidence viewer, prompt orchestration, research connectors, policy fixtures derived from the supplied DOCX.
- Later: eBay OAuth and Inventory API draft creation, image upload, category/item-specific mapping, and explicit publish approval. Fast-track remains deferred.
