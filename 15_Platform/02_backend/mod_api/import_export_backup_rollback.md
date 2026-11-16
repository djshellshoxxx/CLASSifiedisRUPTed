# PS-117-10 — Import, export, backup and rollback: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-10.R01** IdempotencyRecord rows are operational data excluded from the user export (IOX-1); rows restored from an older backup are ignored once expired.
- **PS-117-10.R02** Error codes, the problem shape and the event envelope are versioned contracts; changes within v1 are additive and removed codes are never reused.
- **PS-117-10.R03** HTTP routes are versioned under /api/v1; unknown versions or paths return NOT_FOUND so N-1 clients fail explicitly during a rollback.

## Specification

- **export:** No export section: idempotency records and relay access tokens are operational and expire; the vault export (F10.S01.M03) excludes them.
- **import:** Nothing is imported; a restored vault starts without idempotency records and replays therefore re-execute only commands whose original result was never committed.
- **backup:** Relay tables are covered by the SQLite online backup (F15.S03.M02); vault data by the user's export (IOX-6).
- **migration rollback:** IdempotencyRecord v1 is additive-only; a rollback to N-1 keeps reading the table because kernel schema migrations are forward-only and additive (F15.S02.M03).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T06 | unit | PS-117-04.R03, PS-117-10.R02 | defineEvent with bad names and an envelope with an extra payload key | definitions rejected; envelope has exactly the CTR-EVT-001 keys; bad payload throws |
| TEST-PS-117-09.T13 | integration | PS-117-01.R03, PS-117-07.R02, PS-117-10.R01 | replay at 24 h - 1 ms and at 24 h, then purge | replay before expiry, execution after; purge removes one row |
| TEST-PS-117-09.T18 | unit | PS-117-07.R01, PS-117-10.R02 | render problem JSON and snapshot the common code table | exact RFC 9457 fields; no stack; table equals CTR-ERR-001 plus ID_TIMESTAMP_SKEW; defineErrors rules |
| TEST-PS-117-09.T19 | integration | PS-117-04.R04, PS-117-07.R03, PS-117-10.R03 | sample relay over node:http with replay, reuse, 300 KiB body, form body, GET, bad JSON, bad token, vault command, /api/v2 | 201, Idempotent-Replay, problem+json 422, 413, 415, 405, 422, 401, 404, 404; security headers; logs carry truncated IP only |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
