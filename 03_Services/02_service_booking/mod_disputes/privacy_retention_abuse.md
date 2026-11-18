# PS-030-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-07.R01 | No location field in dispute link or events (CTR-PRV-001 R03). Service location is referenced only through the booking. | MVP |
| PS-030-07.R02 | Disputes are never federated in MVP (CTR-FED-001 R02, R03 for financial-adjacent data). | MVP |
| PS-030-07.R03 | Evidence bodies are held by F09/F12 evidence stores, never in this module. This module holds digests only. | MVP |
| PS-030-07.R04 | Serial-dispute abuse: > 3 opened disputes per account in 30 days without resolution → `DISPUTE.RATE_LIMITED` with retry-after (ASSUMPTION). | MVP |
| PS-030-07.R05 | Reason-code misuse signals (e.g. repeated `NOT_DELIVERED` on delivered subjects) are sent to F12 by full ID; this module applies no sanctions. | MVP |
| PS-030-07.R06 | Participant erasure: link IDs and state retained where a legal hold or open dispute exists (CTR-PRV-001 R07); otherwise personal references are replaced with a tombstone. | MVP |
| PS-030-07.R07 | `requested_minor` is classed FINANCIAL_EVIDENCE: visible to participants and authorized F09 operators only. | MVP |

## Data / schema
Classes: `dispute_ref` PSEUDONYMOUS, `opened_by` PSEUDONYMOUS, `reason_code` PRIVATE_PERSONAL (ASSUMPTION: coarse category may reveal health or conduct), `requested_minor` FINANCIAL_EVIDENCE, digests PSEUDONYMOUS. Retention: link rows follow F09 record class (D07 PROVISIONAL).

## Commands / queries / events
Events carry `max_data_class` PSEUDONYMOUS at most; `reason_code` is omitted from events exported to analytics.

## States & transitions
Erasure path does not change `link_state` except to tombstone reference IDs.

## Validation & errors
Rate-limit code `DISPUTE.RATE_LIMITED` (retryable true, retry-after header).

## Authorization
Read of link: participants only ([authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Tombstoning is idempotent per link ID.

## Privacy, retention, abuse
Threats: harassment via serial disputes, false non-delivery claims, leakage of health or conduct details through reason codes, graph linking of counterparties. Controls: R04, R05, R06, R07, and no reason code in public surfaces. Retention: 30 days after terminal state for link metadata unless a hold applies (ASSUMPTION; D07 PROVISIONAL).

## Observability & budgets
Logs: link ID hash, reason_code enum, result. No narrative text. Rate-limit counter per account.

## Tests
- TEST-PS-030-07-01 unit: rate limit at 4th open within 30 days.
- TEST-PS-030-07-02 privacy: log scan finds no note or amount text.
- TEST-PS-030-07-03 integration: erasure with open dispute keeps link; erasure after close tombstones.

## Acceptance criteria
1. No event exports a reason code or amount to analytics.
2. Federation of dispute records is impossible in MVP configuration.
3. Erasure outcome matches R06 in both branches.

## Assumptions & open decisions
- ASSUMPTION: 3 disputes per 30 days limit; reason code classed PRIVATE_PERSONAL.
- D07 (retention) PROVISIONAL.
- Payment checklist applies: FINANCIAL_EVIDENCE class visibility per CTR-CAP-001 R06 (purpose and expiry on operator access).
