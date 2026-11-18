# PS-113-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-07.R01 | Language preference is PSEUDONYMOUS and is not sent to analytics by default. | MVP |
| PS-113-07.R02 | Language is not used to infer nationality, region or location. | MVP |
| PS-113-07.R03 | Missing-key telemetry records key name and locale only, never user content. | MVP |
| PS-113-07.R04 | Translators have no production access; catalogs are reviewed in source control (ASSUMPTION). | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| profile.language | PSEUDONYMOUS | RET-ACC |
| catalog files | PUBLIC | release lifetime |
| missing-key counters | PSEUDONYMOUS aggregate | RET-OPS 30 days |

## Commands / queries / events
No personal data in catalog responses or events.

## States & transitions
Account deletion clears the preference with the profile.

## Validation & errors
No echo of language input in errors.

## Authorization
See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Not applicable beyond cleanup on logout.

## Privacy, retention, abuse
- Abuse: malicious translation text (script or phishing) inserted via translator workflow; mitigated by R04, markup ban and CI checks (PS-113-02.R03).
- Privacy: browser language lists fingerprint users; the app reads them only for fallback and does not store them (PS-113-03).

## Observability & budgets
Aggregates only.

## Tests
- TEST-PS-113-07-01 (contract): analytics payload fixtures contain no language values per account.
- TEST-PS-113-07-02 (unit): missing-key log contains no user strings.
- TEST-PS-113-07-03 (security): catalog with script tag fails build.
- TEST-PS-113-07-04 (integration): deletion clears preference.

## Acceptance criteria
1. Telemetry scans pass.
2. Markup ban verified.
3. Privacy Lead review pending.

## Assumptions & open decisions
- ASSUMPTION: translators have source-control access only.
- D07 PROVISIONAL (D07 default, unapproved).
