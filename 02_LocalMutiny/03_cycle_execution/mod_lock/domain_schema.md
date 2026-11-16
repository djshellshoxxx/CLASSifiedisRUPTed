# PS-023-01 — Domain schema: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-01.R01** A CycleLock holds one giver's reserved item set for one subject, the revision hash it was made against, the absolute expiry, the direction own or peer and, for own reservations, the local inventory hold ids.
- **PS-023-01.R02** The record is the reservation statement itself (signed, with cid) so peers' copies are verifiable evidence, and the own copy additionally links local holds that exist only in this vault.
- **PS-023-01.R03** Expiry is absolute and never renewed; extending a promise means signing a new reservation that supersedes the old one before it expires.

## Specification

### CycleLock

Schema `classrup.mutiny.cycle_lock/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key in the vault |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — trade_proposal \| cycle |
| subjectId | uuidv7 — holder id; for a proposal that becomes a cycle the cycle id equals the proposal id |
| giverId | did — signer of the reservation; owner of the items |
| kind | enum — reserve \| release |
| direction | enum — own \| peer |
| revisionHash | cid — proposal revision digest the reservation was made against |
| items | array — 1..5 items {inventoryItemId uuidv7, listingCid cid, quantity int 1..99, holdId? uuidv7}; holdId only on own |
| expiresAt | timestamp — absolute; consentDeadline + executionWindowMs, at most 37 days after issue; evaluated on the local clock |
| issuedAtClaim | timestamp — signer's clock, a claim |
| status | enum — active \| released \| converted \| expired \| superseded \| conflicted |
| releaseReason? | enum — declined \| withdrawn \| cancelled \| completed \| recovered \| item_lost \| fork_frozen \| superseded |
| cid | cid — sha256 of JCS(envelope minus sig) |
| sig | string — Ed25519 signature (base64url) per CTR-FED-001 FED-2 |
| provenance? | object — {originRelay?, receivedAt (local clock), via[], verifiedAt} for peer statements |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- An own reservation with status active has every item's holdId present and active in the local inventory, and all items were reserved in one transaction.
- At most one active CycleLock exists per (subjectId, giverId, direction); a new reserve supersedes the earlier one.
- expiresAt is never changed after creation; status moves only forward and terminal states do not reopen.
- The sum of quantities of active own reservations for one inventory item never exceeds the item's available quantity.

### Storage DDL

```sql
CREATE TABLE mutiny_cycle_lock (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, giver_id TEXT NOT NULL, direction TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, cid TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_lock_active ON mutiny_cycle_lock(tenant_id, subject_id, giver_id, direction) WHERE status = 'active';
CREATE UNIQUE INDEX mutiny_lock_cid ON mutiny_cycle_lock(tenant_id, cid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T01 | unit | PS-023-01.R01, PS-023-01.R03, PS-023-02.R01 | reserve I1 and I2 | both holds active, statement signed, expiry equals deadline plus execution window |
| TEST-PS-023-09.T04 | integration | PS-023-06.R02, PS-023-01.R02, PS-023-09.R03 | two concurrent reserves of the same quantity-1 item for different subjects | exactly one succeeds, the other MUTINY_LOCK_CONFLICT without naming the first |
| TEST-PS-023-09.T16 | integration | PS-023-04.R03, PS-023-01.R01 | 2-, 3-, 4- and 6-party fixtures | all-givers-reserved flag true only when every giver has a valid unexpired statement |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
