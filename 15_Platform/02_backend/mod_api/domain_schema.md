# PS-117-01 — Domain schema: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-01.R01** An IdempotencyRecord stores tenantId, actor, command name, idempotency key, requestHash (SHA-256 of canonical JSON of the raw input), response status, response JSON body, createdAt and expiresAt.
- **PS-117-01.R02** All identifiers are lowercase canonical UUIDv7 values generated from WebCrypto randomness with a monotonic counter inside one millisecond; IDs more than 24 h ahead of the receiver clock are rejected with ID_TIMESTAMP_SKEW.
- **PS-117-01.R03** IdempotencyRecord rows expire 24 h after creation; lookups ignore expired rows and a purge removes them.

## Specification

### IdempotencyRecord

Schema `classrup.platform.idempotency_record/v1` · storage **relay+device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| tenantId | uuidv7 — vault ID in the vault, relay tenant on a relay |
| actor | string — local principal did:key, relay actor ID, or anonymous |
| command | string — command name <slug>.<entity>.<verb> |
| key | uuidv7 — client Idempotency-Key |
| requestHash | string — hex SHA-256 of canonical JSON of the raw input |
| status | int — HTTP-equivalent success status 200, 201 or 202 |
| response | json — normalized handler output replayed on retry |
| createdAt | timestamp — RFC 3339 UTC |
| expiresAt | timestamp — createdAt + 24 h |

**Invariants**
- At most one record per (tenantId, actor, command, key).
- Only successful command results are stored; a failed command leaves no record so a corrected retry can run.
- The record is written in the same transaction as the handler's records and outbox events.

### Storage DDL

```sql
CREATE TABLE idempotency (
  tenant TEXT NOT NULL, actor TEXT NOT NULL, command TEXT NOT NULL, key TEXT NOT NULL,
  request_hash TEXT NOT NULL, status INTEGER NOT NULL, response TEXT NOT NULL,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY (tenant, actor, command, key)) WITHOUT ROWID;
CREATE INDEX idempotency_expiry ON idempotency(expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T01 | unit | PS-117-01.R02 | generate and parse UUIDv7 values | lowercase canonical v7 with variant 10; uppercase, braces, v4 and wrong variant are rejected with INVALID_UUIDV7 |
| TEST-PS-117-09.T02 | property | PS-117-01.R02, PS-117-09.R03 | random clock steps including bursts and regressions, 200 runs, plus 100 000 IDs in one millisecond | IDs unique and strictly increasing per generator |
| TEST-PS-117-09.T03 | unit | PS-117-01.R02, PS-117-02.R03 | IDs 24 h and 24 h + 1 ms ahead of the receiver clock | first accepted, second ID_TIMESTAMP_SKEW |
| TEST-PS-117-09.T10 | integration | PS-117-01.R01, PS-117-06.R01 | same key and body twice, then changed body, then other actor | replay with original 201 and body; IDEMPOTENCY_KEY_REUSED; other actor executes |
| TEST-PS-117-09.T13 | integration | PS-117-01.R03, PS-117-07.R02, PS-117-10.R01 | replay at 24 h - 1 ms and at 24 h, then purge | replay before expiry, execution after; purge removes one row |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
