# PS-094-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-07.R01 | Reporter identity is hidden from the reported party and other reporters in every response, notice and event. | MVP |
| PS-094-07.R02 | `detail_text` is PRIVATE_PERSONAL; never published, federated, pushed or logged. | MVP |
| PS-094-07.R03 | Reports are never federated (CTR-FED-001 is for signed content events; report data is local). | MVP |
| PS-094-07.R04 | Status notices are generic ("We received your report"; "A decision was made") and never name the reason or reporter. | MVP |

## Data classes and retention
| Item | Class | Retention |
|---|---|---|
| reporter_ref, weight, dedupe_hmac | PSEUDONYMOUS / SECRET (hmac) | RET-AUD 12 months after closure; hmac RET-EPH 24 h |
| detail_text | PRIVATE_PERSONAL | RET-PRIV; redacted at closure when reason is doxxing_or_personal_data |
| report status metadata | PUBLIC/PSEUDONYMOUS | RET-AUD |
| queue entries | PSEUDONYMOUS | RET-EPH until triaged |

## Threats and controls
| Threat | Control |
|---|---|
| Brigading: many accounts flag one target | per-target weight cap per 24 h; new-account weight 0.2 (ASSUMPTION); threshold raises priority only |
| Retaliatory reports after a dispute | reporter-target relation check; mod_abuse signal on repeat patterns |
| Doxxing inside detail text | reason doxxing_or_personal_data routes to high priority; text redacted at closure |
| Reporter discovered by timing | uniform responses (CTR-ERR-001 R08) |
| Reporter identity in shared backups | backups encrypted; access per CTR-PRV-001 |

## Abuse controls
Quota 20 per 24 h per reporter (PS-094-02). Restricted reporters (mod_abuse) cannot submit. False-report pattern scoring is owned by mod_abuse (PS-095).

## Validation & errors
Privacy-driven refusals reuse `SYS.NOT_FOUND`; no detail text in errors.

## Failure, idempotency, concurrency, offline
Offline queue encrypted; purged at logout. Redaction at closure is idempotent.

## Observability & budgets
Zero tolerance: any reporter_ref in a non-case response is a Sev-2 alert (CTR-PRV-001 R09).

## Tests
- TEST-PS-094-07-01 (privacy): reported party responses across all endpoints lack reporter fields.
- TEST-PS-094-07-02 (brigading): 50 reports from new accounts on one target → weight sum capped, one threshold event.
- TEST-PS-094-07-03 (redaction): detail_text redacted at closure for doxxing reason; hash-chain retains event.

## Acceptance criteria
1. Zero reporter-identity leaks in fixture corpus.
2. Retention purge of detail_text within 24 h of class maximum (CTR-PRV-001 R06).

## Assumptions & open decisions
- ASSUMPTION: new-account weight 0.2; per-target cap 2.0 per 24 h from single-source flood.
- PROVISIONAL (D07 default, unapproved): minimal retention, legal-hold exceptions.
- PROVISIONAL (D05 default, unapproved): report text cannot contain precise location fields (rejected at validation if detected by pattern).
