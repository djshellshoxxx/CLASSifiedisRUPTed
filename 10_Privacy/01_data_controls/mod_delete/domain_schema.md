# PS-077-01 — Domain schema: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-01.R01** A DeletionRequest stores the principal did, status, request time, grace end (14 days), deferral limit, evidence option, per-module step states, per-relay delivery states and the completion summary.
- **PS-077-01.R02** The pseudonymization salt exists only inside the request until completion and is then destroyed, so the pseudonym cannot be recomputed from the did afterwards.
- **PS-077-01.R03** A tombstone ledger entry (ID, type, deletedAt) is kept for 180 days after completion; the request record itself is P3 and retained as RET-EVIDENCE as proof of the deletion request.

## Specification

### DeletionRequest

Schema `classrup.privacy.deletion_request/v1` · storage **device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| did | did — principal being deleted |
| status | enum — pending_grace \| deferred \| executing \| failed \| completed \| cancelled |
| requestedAt | timestamp — local clock |
| graceEndsAt | timestamp — requestedAt + 14 days |
| deferredUntil? | timestamp — at most graceEndsAt + 30 days |
| keepEvidence | boolean — default true; false also purges the user's own evidence copies in the vault |
| salt? | string — 256-bit random value; present only until completion, then destroyed |
| pseudonym? | string — del- plus 16 base32 characters of HMAC-SHA256(salt, did); set at execution |
| steps | array — up to 64 {moduleId, step: tombstone\|pseudonymize\|shred\|purge, state: pending\|done\|failed, attempts: int ≤ 8} |
| blockers | array — open commitments {kind, ref} found at the last check, up to 50 |
| relays | array — up to 20 {relayId, statementCid, syncState: prepared\|transport_acknowledged\|peer_accepted} |
| tombstoneCount | int — ≥ 0 |
| completedAt? | timestamp — local clock |
| ledgerUntil? | timestamp — completedAt + 180 days |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one request in pending_grace, deferred, executing or failed status per vault.
- graceEndsAt equals requestedAt plus 14 days exactly and cannot be shortened.
- salt is absent whenever status is completed or cancelled.
- status executing is never cancelled; cancel is allowed only in pending_grace and deferred.

### Storage DDL

```sql
CREATE TABLE privacy_deletion_request (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, status TEXT NOT NULL, grace_ends_at TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX privacy_deletion_active ON privacy_deletion_request(vault_id)
  WHERE status IN ('pending_grace','deferred','executing','failed');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-01.R01, PS-077-01.R02, PS-077-02.R01, PS-077-02.R02 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T02 | unit | PS-077-01.R03, PS-077-02.R03, PS-077-03.R01 | cancel at day 13; try to cancel while executing | cancelled with salt destroyed; executing refuses with CONFLICT_STATE |
| TEST-PS-077-09.T15 | e2e | PS-077-01.R02, PS-077-07.R02 | user flow on two devices with banner, cancel and final summary | banner and summary shown with limits; axe zero serious issues |

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
