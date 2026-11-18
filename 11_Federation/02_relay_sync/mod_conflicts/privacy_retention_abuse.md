# PS-086-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01 classes, R06 retention, R09 logs), CTR-FED-001 (R03 never-federated classes, R07 tombstones, R08 per-audience pseudonyms, peer states), CTR-EVT-001 (R06 no names or coordinates), CTR-SCH-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-07.R01 | Conflict records and evidence bytes hold only classes allowed for federation: `PUBLIC`, `PSEUDONYMOUS`, `LOCATION_COARSE` as a registered cell (CTR-FED-001 R02). Any envelope with a never-federated class is refused at step 11 before storage. | MVP |
| PS-086-07.R02 | Raw evidence is kept under RET-EVD: 24 months after the conflict is `closed` (ASSUMPTION; jurisdiction review OPEN). After 12 months, personal fields are redacted and hashes retained (CTR-COM-001 pattern, ASSUMPTION). | MVP |
| PS-086-07.R03 | Evidence is not deleted before the conflict is `closed`, even if the origin tombstones the target. The tombstone and the conflict are both retained. | MVP |
| PS-086-07.R04 | Peer abuse: a peer that produces ≥ 3 equivocations in 30 days is `revoked` by automated rule (ASSUMPTION). Equivocation by any peer otherwise moves it to `quarantined` (CTR-FED-001). | MVP |
| PS-086-07.R05 | Logs and metrics carry IDs, kind and codes only. Evidence bytes never appear in logs. | MVP |

## Data / schema
| Data | Class | Retention |
|---|---|---|
| Conflict record (IDs, digests, status) | PSEUDONYMOUS | RET-EVD, 24 months after `closed` |
| Raw evidence bytes | max class of the envelope (≤ PSEUDONYMOUS in practice) | RET-EVD; redaction at 12 months |
| Hold queue bytes | as above | until release, rejection or expiry (≤ 24 h) |
| Operation logs | PSEUDONYMOUS | RET-OPS, 30 days |

## Validation & errors
Error diagnostics carry code and field path only.

## Authorization
Evidence reads are privileged and audited (PS-086-05 R04).

## Failure, idempotency, concurrency, offline
Deletion or redaction propagates to replicas within 24 h (CTR-PRV-001 R06). Legal holds (CTR-PRV-001 R07) can extend RET-EVD for a named matter.

## Privacy, retention, abuse
- Threats: deliberate forking to cause confusion (quarantine and evidence); evidence used as a mass store for third-party payloads (no bytes beyond the two conflicting envelopes); metadata inferred from `delivered_by_fpr` (pseudonymous; visible to stewards only).
- Per-audience pseudonyms on export (CTR-FED-001 R08) mean conflict records do not link one user across nodes.
- Restore of a quarantined peer requires review (PS-086-03 R04), which blocks an abuse loop.

## Observability & budgets
`fed_conflict_redaction_due_total`. Budgets in PS-086-08.

## Tests
- TEST-PS-086-07-01 (unit): envelope with never-federated class refused at step 11, not stored.
- TEST-PS-086-07-02 (integration): tombstone arrives while conflict is open; evidence retained until `closed`.
- TEST-PS-086-07-03 (integration): redaction at 12 months keeps hashes; personal fields absent.
- TEST-PS-086-07-04 (abuse): third equivocation in 30 days revokes the peer.
- TEST-PS-086-07-05 (negative): evidence bytes absent from logs and metrics in a full run.

## Acceptance criteria
1. No never-federated class stored; TEST-PS-086-07-01 passes.
2. Evidence retained until close and redacted on schedule; TEST-PS-086-07-02 and -03 pass.
3. Automated revocation rule holds; TEST-PS-086-07-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: RET-EVD 24 months; 12-month redaction; 3-in-30-days revocation (F10 to confirm).
- OPEN: jurisdiction review for RET-EVD (R07, RISK_REGISTER.md).
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
