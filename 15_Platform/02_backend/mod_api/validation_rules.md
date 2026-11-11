# PS-117-02 — Validation rules: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-02.R01** Command and query input is parsed strictly with zod; unknown keys, missing fields and type errors return VALIDATION_FAILED with fields [{path, code}] using stable UPPER_SNAKE codes.
- **PS-117-02.R02** Shared validators exist for UUIDv7, RFC 3339 UTC millisecond timestamps, strings bounded in code points and the Money shape {amount integer string, currency 3 to 10 uppercase}.
- **PS-117-02.R03** Idempotent commands require an Idempotency-Key that is a UUIDv7; a missing or malformed key returns VALIDATION_FAILED on field idempotencyKey and a key from the future returns ID_TIMESTAMP_SKEW.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | input matches the definition's strict zod schema; unknown keys are rejected | VALIDATION_FAILED |
| V02 | Idempotency-Key present and a lowercase UUIDv7 for idempotent commands | VALIDATION_FAILED |
| V03 | embedded UUIDv7 timestamp of the key is at most now + 24 h | ID_TIMESTAMP_SKEW |
| V04 | HTTP request body is at most 256 KiB | PAYLOAD_TOO_LARGE |
| V05 | HTTP Content-Type is application/json | PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE |
| V06 | HTTP method is POST for /api/v1/cmd and /api/v1/query and GET for health and metrics | PLATFORM_BUS_METHOD_NOT_ALLOWED |
| V07 | the name is registered and reachable from the caller's surface (vault definitions are local only) | NOT_FOUND |
| V08 | a reused key carries the same request hash as the stored record | IDEMPOTENCY_KEY_REUSED |
| V09 | If-Match, when present, is a positive integer revision | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T03 | unit | PS-117-01.R02, PS-117-02.R03 | IDs 24 h and 24 h + 1 ms ahead of the receiver clock | first accepted, second ID_TIMESTAMP_SKEW |
| TEST-PS-117-09.T04 | unit | PS-117-02.R01 | unknown, missing, mistyped and too long fields | VALIDATION_FAILED with UNKNOWN_FIELD, REQUIRED, INVALID_TYPE, TOO_BIG paths |
| TEST-PS-117-09.T05 | unit | PS-117-02.R02 | uuidv7, timestamp, code-point string and Money validators with good and bad values | documented field codes; emoji counted as one code point |
| TEST-PS-117-09.T16 | unit | PS-117-02.R03 | idempotent command without key, with v4 key and with a key 25 h ahead | REQUIRED, INVALID_UUIDV7, ID_TIMESTAMP_SKEW |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
