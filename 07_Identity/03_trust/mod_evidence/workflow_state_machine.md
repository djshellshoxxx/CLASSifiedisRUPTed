# PS-057-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (R05), CTR-ERR-001, CTR-SCH-001 (R08 lossless views).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-03.R01 | Record states: `recorded` (initial), `superseded` (terminal), `withdrawn` (terminal). | MVP |
| PS-057-03.R02 | Withdrawal is by subject or issuer only; it hides the record from trust scoring but keeps the digest for dispute and quarantine evidence. | MVP |
| PS-057-03.R03 | A record can be superseded once; superseding record must be `recorded`. | MVP |
| PS-057-03.R04 | Withdrawn or superseded records are excluded from mod_reputation scoring within 60 s of the event. | MVP |
| PS-057-03.R05 | Equivocating signed records (same issuer, subject, kind and body hash differences) move to `quarantined` for review by F12. | MVP |
| PS-057-03.R06 | Automatic expiry of evidence. | Future |

## Data / schema
`evidence_state` enum: `recorded`, `superseded`, `withdrawn`, `quarantined`. See [domain_schema.md](domain_schema.md).

## Commands / queries / events
`RecordEvidence`, `SupersedeEvidence`, `WithdrawEvidence`; emits `evidence.recorded`, `evidence.superseded`, `evidence.withdrawn`, `evidence.quarantined` (PS-057-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `RecordEvidence` | PS-057-02 passes | `recorded` | event `evidence.recorded` |
| `recorded` | `SupersedeEvidence` | R03 | `superseded` (old); new `recorded` | event `evidence.superseded` |
| `recorded` | `WithdrawEvidence` | caller is subject or issuer | `withdrawn` | event `evidence.withdrawn`; reputation recompute |
| `recorded` | equivocation detected | R05 | `quarantined` | event `evidence.quarantined`; alert F12 |
| `quarantined` | F12 decision | case grant | `withdrawn` or `recorded` | decision recorded in `aud_` |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `EVIDENCE.WITHDRAWN` | false | `err.evidence.withdrawn` |
| `EVIDENCE.SUPERSEDED` | false | `err.evidence.superseded` |
| `EVIDENCE.QUARANTINED` | false | `err.evidence.quarantined` |

## Authorization
Withdraw: subject or issuer (`evidence.withdraw`). Quarantine decision: `mod_` with case grant only (CTR-CAP-001 R04).

## Failure, idempotency, concurrency, offline
- Revision check on every transition; conflict → `EVT.REVISION_CONFLICT`.
- Withdrawal and supersession racing: first committed transition wins; second receives state-specific error.
- Scoring recompute is eventually consistent within 60 s; stale scores are flagged, not served silently.

## Privacy, retention, abuse
Quarantine reviews produce `aud_` records with no digest content. Withdrawn records keep digest only.

## Observability & budgets
`evidence_transition_total{from,to}`; `evidence_quarantine_open` gauge; alert if quarantine backlog > 100 (ASSUMPTION).

## Tests
- TEST-PS-057-03-01 (unit): transition table complete.
- TEST-PS-057-03-02 (integration): withdrawn record excluded from score within 60 s.
- TEST-PS-057-03-03 (integration): equivocation fixture quarantines issuer record set.
- TEST-PS-057-03-04 (concurrency): supersede vs withdraw race yields one winner.

## Acceptance criteria
1. Only listed transitions occur.
2. Excluded records do not affect scores after 60 s.
3. Quarantine is reversible only by F12 decision.
4. Race outcomes are deterministic.

## Assumptions & open decisions
- ASSUMPTION: 60 s propagation bound to reputation.
- PROVISIONAL (D06 default, unapproved): signed statements; quarantine on equivocation.
