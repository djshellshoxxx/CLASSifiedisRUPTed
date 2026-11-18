# PS-101-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R04, R06, R09, R12), CTR-EVT-001 (R11), CTR-CAP-001 (R04).

**Decision labels:** Retention 30 days and K_MIN = 5 are PROVISIONAL (D07 default, unapproved). Privacy review by F10: OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-07.R01 | Signal records are class PSEUDONYMOUS. Behavioural patterns are not exported as personal data in MVP. | MVP |
| PS-101-07.R02 | No IP address, device identifier, coordinate, precise location or message content is stored or logged. | MVP |
| PS-101-07.R03 | Active signals retained 30 days (RET-OPS). Suppression and audit records retained 12 months (RET-AUD), with no signal content. | MVP |
| PS-101-07.R04 | Subject deletion redacts linkage within 24 hours (CTR-PRV-001 R06). Backups follow the backup schedule; restore replays redaction. | MVP |
| PS-101-07.R05 | One reporter may contribute at most one `report_density` signal per target per 24 hours. | MVP |
| PS-101-07.R06 | Aggregates output only when ≥ 5 distinct subjects contribute (K_MIN). | MVP |
| PS-101-07.R07 | No per-subject signal graph is exported or published. | MVP |

## Data / schema
Only the fields in PS-101-01. Per-field classes: `subject_ref` PSEUDONYMOUS, `value` PSEUDONYMOUS, `window_*` PSEUDONYMOUS, `source_module` PUBLIC. Any future field requires an F10 class review (CTR-SCH-001 R10).

## Commands / queries / events
Events carry `max_data_class = PSEUDONYMOUS`. Redaction keeps the envelope and replaces `subject_ref` with a keyed digest (CTR-EVT-001 R08).

## States & transitions
REDACTED is entered on deletion (PS-101-03).

## Validation & errors
Forbidden-field rejection is the main collection control (PS-101-02 R04).

## Authorization
Access limited to case-scoped moderators (PS-101-05).

## Failure, idempotency, concurrency, offline
Deletion during scoring: scorer drops the subject on next cycle. Offline: not applicable.

## Privacy, retention, abuse
Abuse controls:
| Threat | Control |
|---|---|
| Framing by coordinated false reports | R05 cap; reporter pseudonymity; signals alone never sanction (appeal path F12.S01.M01) |
| Graph deanonymization from aggregates | K_MIN = 5 (R06); no per-subject outputs (R07) |
| Sybil bursts from legitimate events (for example, a launch day) | `confidence_bucket` lowered by event calendar; human review before action |
| Poisoning by compromised producer | Producer allowlist by `source_module`; anomaly alert on value distribution |
| Federated poisoning | Out of MVP scope (PS-101-01 R07) |

## Observability and budgets
Retention job reports expired and redacted counts. Privacy alert on any forbidden-field rejection spike (PS-101-08).

## Tests
- TEST-PS-101-18 (negative): payload containing coordinates is rejected and not logged.
- TEST-PS-101-19 (integration): deletion redacts all records of subject within 24 hours.
- TEST-PS-101-20 (property): aggregate with 4 subjects never returned; with 5 returned.
- TEST-PS-101-21 (integration): second report from same reporter on same target within 24 h produces no new signal.

## Acceptance criteria
1. F10 privacy review completed (future gate; OPEN).
2. Log scan finds no IP, coordinate or message content in test corpus.
3. Abuse table has one test per row.

## Assumptions & open decisions
- ASSUMPTION: behavioural signals are not reclassified as LOCATION or FINANCIAL data.
- D07 retention and abuse thresholds (PROVISIONAL, unapproved). D05 geoprivacy: no location input accepted.
