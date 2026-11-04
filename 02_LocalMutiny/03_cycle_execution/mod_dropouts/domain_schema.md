# PS-022-01 — Domain schema: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-01.R01** A DropoutRecord is append-only evidence that a participant stopped participating, with the coarse reason shared with others, the finer private reason kept locally, the phase and the evidence basis.
- **PS-022-01.R02** Records created from a participant's own signed withdrawal carry the Ed25519 statement; records created from timeouts or local signals are labelled local_clock or local_signal and are not signed facts about the other person.
- **PS-022-01.R03** The phase is computed in the same transaction as the record from the handover evidence that this vault holds, and it is stored so later arrivals cannot change history.

## Specification

### DropoutRecord

Schema `classrup.mutiny.dropout_record/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| cycleId | uuidv7 — cycle the dropout belongs to |
| participantId | did — participant who dropped, or the giver whose item or reservation was lost |
| publicReason | enum — withdrew \| unavailable \| timeout — the only reason shared with other participants |
| privateReason? | enum — blocked_locally \| item_lost \| lock_expired \| declined_after_consent \| consent_deadline \| execution_deadline \| other — local only, never in statements or events |
| phase | enum — before_commit \| committed_no_handover \| after_handover |
| outcome | enum — cancelled \| partially_executed |
| evidenceBasis | enum — signed_by_participant \| local_clock \| local_signal \| peer_notice |
| direction | enum — own \| peer \| detected |
| handoverEvidenceCount | int — number of verified handover attestations held at record time, 0..16 |
| statementCid? | cid — cid of the signed classrup.mutiny.cycle_withdrawal/v1 when signed |
| claimedAt? | timestamp — signer's clock, a claim |
| detectedAt | timestamp — local clock when recorded |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- A DropoutRecord is never updated after creation except for pseudonymization on identity erasure.
- At most one record exists per (cycleId, participantId, publicReason).
- outcome cancelled implies handoverEvidenceCount equals 0 at record time, and outcome partially_executed implies it is at least 1.
- privateReason never appears in any signed statement, event payload or log.

### Storage DDL

```sql
CREATE TABLE mutiny_dropout_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cycle_id TEXT NOT NULL, participant_id TEXT NOT NULL, public_reason TEXT NOT NULL,
  phase TEXT NOT NULL, outcome TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_dropout_unique ON mutiny_dropout_record(tenant_id, cycle_id, participant_id, public_reason);
CREATE INDEX mutiny_dropout_cycle ON mutiny_dropout_record(tenant_id, cycle_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T01 | integration | PS-022-01.R01, PS-022-03.R01, PS-022-04.R02 | Bob withdraws in committed 3-party cycle before any handover | cancelled in all three vaults, reservations released, exactly one cancelled event per vault |
| TEST-PS-022-09.T02 | integration | PS-022-01.R03, PS-022-03.R02, PS-022-06.R02 | Dan withdraws in 4-party cycle after Alice's handed_over evidence | outcome partially_executed, cycle not cancelled, recovery opened by F02.S03.M04 |
| TEST-PS-022-09.T09 | abuse | PS-022-05.R01, PS-022-05.R02, PS-022-07.R02, PS-022-01.R02, PS-022-02.R02 | forged withdrawal for another person; other principal calls withdraw; replay on new cycle | quarantined or FORBIDDEN; replay ignored |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M04, F02.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
