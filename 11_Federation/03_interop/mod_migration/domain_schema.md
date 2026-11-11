# PS-090-01 — Domain schema: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-01.R01** A MigrationRecord stores kind, subject, from and to relay, the move statement cid, the claimed announcement time, this receiver's first verified receipt and computed effective time, redirect end, status, copy progress and direction (own or observed) with tenant and revision per CTR-ID-001.
- **PS-090-01.R02** The move statement is a public signed statement and carries only did, relay ids, base URLs and times; it never contains record contents or contact details.
- **PS-090-01.R03** The redirect period is 180 days, equal to the minimum tombstone stub retention, so a moved author cannot be resurrected on the old relay by replay.

## Specification

### MigrationRecord

Schema `classrup.federation.migration/v1` · storage **relay+device** · privacy **P0** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| kind | enum — account \| relay |
| direction | enum — own \| observed |
| subject | string — did:key of the principal for account moves, relay id for relay moves |
| fromRelay | string — relay id or base URL before the move |
| toRelay | string — relay id or base URL after the move |
| moveCid? | string — cid of the signed classrup.federation.move/v1 statement |
| signerKey? | string — device key (account moves) or relay key (relay moves) that signed the move |
| announcedAt? | timestamp — claim of the signer; for own moves the local clock at signing |
| firstReceivedAt? | timestamp — this receiver's clock at its first verified receipt (own: announcedAt) |
| windowSource | enum — own_clock \| first_receipt \| old_relay_receipt |
| effectiveAt? | timestamp — on this receiver's clock: max(window start + 24 h, signer key first seen + 24 h) |
| redirectUntil? | timestamp — effectiveAt + 180 days |
| copyProgress | json — {records: int, tombstones: int, delivered: int, failed: int} |
| vetoedBy? | string — did of the device key that cancelled during the window |
| conflictId? | uuidv7 — open F11.S02.M03 conflict holding this move |
| status | enum — prepared \| announced \| effective \| cancelled \| closed |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-terminal own account MigrationRecord per principal.
- status effective implies moveCid verified, effectiveAt ≤ now on this receiver's clock, no veto recorded before effectiveAt, the signer key still active at promotion and no open conflict for the subject.
- The subject did never changes in an account move; only the relays where it is reached change.
- A new own account move requires the previous effective move to be at least 30 days old.
- effectiveAt is never computed from announcedAt for an observed move.

### Storage DDL

```sql
CREATE TABLE fed_migration (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, direction TEXT NOT NULL, subject TEXT NOT NULL,
  status TEXT NOT NULL, effective_at TEXT, redirect_until TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_migration_open ON fed_migration(tenant_id, subject)
  WHERE direction = 'own' AND status IN ('prepared','announced');
CREATE INDEX fed_migration_redirect ON fed_migration(subject, status, redirect_until);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged, statement holds only did, relay ids and times |
| TEST-PS-090-09.T20 | integration | PS-090-01.R03 | move effective at E; clock advanced to E + 180 days - 1 min and to E + 180 days | redirect served at the first time; at the second the record is closed and GET /fed/v1/moved returns moved false |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
