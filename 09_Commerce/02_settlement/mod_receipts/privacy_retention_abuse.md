# PS-071-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R06, R08, RET-EVD), CTR-COM-001 (Privacy), CTR-FED-001 (R03). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-07.R01 | EXIF, XMP and GPS metadata stripped before hashing; `exif_stripped = true` set on success. | MVP |
| PS-071-07.R02 | Free text is not part of the claim body; evidence text notes are classed PRIVATE_PERSONAL and encrypted. | MVP |
| PS-071-07.R03 | Evidence retention RET-EVD (24 months after final state; personal fields redacted at 12 months, hashes kept). | MVP |
| PS-071-07.R04 | Evidence is never federated or used for analytics. | MVP |
| PS-071-07.R05 | Encryption at rest with per-item keys held by the platform KMS; keys never leave KMS (CTR-PRV-001 R08). | MVP |

## Data / schema
Classes: `content_ref` SECRET-derived (encrypted); `sha256` PSEUDONYMOUS; `text_note` PRIVATE_PERSONAL.

## Commands / queries / events
Redaction event carries no content.

## States & transitions
Retention: `stored` → `redacted` (12 months) → `expired` (24 months).

## Validation & errors
Unsupported formats rejected pre-storage (PS-071-02).

## Authorization
Content reads per PS-071-05.

## Failure, idempotency, concurrency, offline
Purge idempotent.

## Privacy, retention, abuse
- Forged evidence: digests bind content; forgery requires the claimant to submit a new claim (superseding rule in CTR-COM-001).
- Location leakage: metadata stripping and a scan for coordinate-like text in notes (ASSUMPTION).
- Abuse: upload rate ≤ 20 items per claim party (ASSUMPTION).
- Receipts are self-attested; the UI says so.

## Observability & budgets
Metric: stripped-metadata count (no file names).

## Tests
- TEST-PS-071-07-01 (unit): GPS EXIF removed; digest matches stripped bytes.
- TEST-PS-071-07-02 (integration): redacted item at 12 months keeps hashes only.
- TEST-PS-071-07-03 (contract): evidence not federated.
- TEST-PS-071-07-04 (abuse): 21st upload rejected with `RECEIPT.EVIDENCE_LIMIT`.

## Acceptance criteria
1. Metadata stripping verified on the reference set.
2. Retention enforced.
3. No content in logs.

## Assumptions & open decisions
- ASSUMPTION: upload rate limit and coordinate-scan heuristic.
- D06, D07 (PROVISIONAL defaults, unapproved).
