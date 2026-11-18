# PS-093-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-07.R01 | Content class is PRIVATE_PERSONAL (messages, personal images); metadata is PSEUDONYMOUS. Never PUBLIC for content. | MVP |
| PS-093-07.R02 | Reporter may attach only target content they can read (PS-093-02 R05). No capture of third-party message threads the reporter does not belong to. | MVP |
| PS-093-07.R03 | Evidence is never federated, pushed, or placed in logs (CTR-FED-001 R03; CTR-PRV-001 disclosure matrix). | MVP |
| PS-093-07.R04 | Personal fields of uninvolved third parties are redacted at case closure, before any export. | MVP |
| PS-093-07.R05 | Client-supplied images are labelled unverified; server-internal copies are the default for in-platform content. | MVP |

## Data classes and retention
| Item | Class | Retention | Default |
|---|---|---|---|
| Content bytes | PRIVATE_PERSONAL | RET-PRIV | 12 months after case closure (ASSUMPTION; 365 d max per CTR-PRV-001) |
| Personal fields after redaction | purged | RET-PRIV | 90 days after redaction |
| Hash, metadata, provenance | PSEUDONYMOUS | RET-AUD | 12 months, survives content purge |
| Staging objects | PRIVATE_PERSONAL | RET-EPH | 15 min |
| Legal-hold items | as above | RET-LEGAL | per hold end date (R07) |

## Threats and controls
| Threat | Control |
|---|---|
| Reporter pulls third-party private messages (harassment) | R02 relation check; reported party notified of outcome only. |
| Forged or edited screenshot | Server snapshot preferred; `client_supplied` labelled; hash over stored bytes. |
| GPS or home address in image metadata | Stripped before storage (PS-093-02 R03). |
| Reporter identity leaked to reported party | `captured_by` visibility `case`; never in notices. |
| Stale evidence after account deletion | Deletion propagates purge within 24 h (CTR-PRV-001 R06). |

## Abuse controls
Submissions per reporter capped by mod_rate and mod_limits. Repeated rejected captures raise a signal to mod_abuse. Content of a rejected item is never retained.

## Validation & errors
Privacy-driven rejections use `EVD.TARGET_NOT_REPORTABLE` and `SYS.NOT_FOUND`; no detail about other users' content in diagnostics (CTR-ERR-001 R06).

## Failure, idempotency, concurrency, offline
Purge is idempotent. Missing deletion is detectable through hash chain (CTR-EVT-001 R08).

## Observability & budgets
Zero tolerance: any evidence content in logs, telemetry or push previews is an alert (CTR-PRV-001 R09, R10).

## Tests
- TEST-PS-093-07-01 (privacy fixture): synthetic PII in messages never appears in logs, events or error bodies.
- TEST-PS-093-07-02 (retention): content purged within 24 h of class maximum in replicas and caches.
- TEST-PS-093-07-03 (relation): reporter cannot capture a message from a thread they do not belong to.

## Acceptance criteria
1. Zero occurrences of content or GPS in non-case paths (fixture corpus).
2. Retention and purge timings pass in seeded environment.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): per-category retention with legal-hold exceptions.
- PROVISIONAL (D05 default, unapproved): no precise location retained for evidence.
- ASSUMPTION: 12 months post-closure; jurisdiction review OPEN (CTR-PRV-001 R07).
