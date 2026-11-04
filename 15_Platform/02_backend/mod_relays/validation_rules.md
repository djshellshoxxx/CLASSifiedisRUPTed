# PS-118-02 — Validation rules: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-02.R01** Configuration is validated strictly at startup against a typed schema with defaults and ranges; unknown RELAY_* variables are warned about, invalid ones abort startup.
- **PS-118-02.R02** Every HTTP request is bounded by size and time limits before it reaches the command bus.
- **PS-118-02.R03** Violations map to stable codes; configuration failures use exit code 78 (EX_CONFIG).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | process.versions.node ≥ 22.18.0 and node:sqlite loads | PLATFORM_RELAY_RUNTIME_UNSUPPORTED |
| V02 | RELAY_DATA_DIR and RELAY_DB_PATH are set, writable, and the key file mode is 0600 | PLATFORM_RELAY_CONFIG_INVALID |
| V03 | RELAY_PUBLIC_URL is an https origin (http allowed only when RELAY_ENV=development) | PLATFORM_RELAY_CONFIG_INVALID |
| V04 | RELAY_ALLOWED_ORIGINS is a comma list of https origins, no wildcard, ≤ 20 entries | PLATFORM_RELAY_CONFIG_INVALID |
| V05 | RELAY_PORT 1..65535, RELAY_BODY_LIMIT_BYTES 1024..8388608, RELAY_DRAIN_MS 1000..30000, RELAY_OUTBOX_BATCH 1..500 | PLATFORM_RELAY_CONFIG_INVALID |
| V06 | request body ≤ RELAY_BODY_LIMIT_BYTES (default 1048576) | PAYLOAD_TOO_LARGE |
| V07 | relay is not draining when the request is accepted | PLATFORM_RELAY_DRAINING |
| V08 | key file present when RelayIdentity exists, and its public key equals the stored active key | PLATFORM_RELAY_IDENTITY_MISSING |
| V09 | dispatcher lease acquired (holder = instance uuid, TTL 30 s) | PLATFORM_RELAY_DUPLICATE_INSTANCE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T02 | unit | PS-118-02.R01, PS-118-02.R02 | each config rule V01-V05 violated in turn plus an unknown RELAY_* variable | exit code 78, names listed, values absent from output; unknown variable only warned |
| TEST-PS-118-09.T03 | integration | PS-118-02.R03, PS-118-02.R02 | send 2 MiB body, slow headers, request during drain | PAYLOAD_TOO_LARGE, connection closed after 10 s headers timeout, PLATFORM_RELAY_DRAINING with Retry-After 5 |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
