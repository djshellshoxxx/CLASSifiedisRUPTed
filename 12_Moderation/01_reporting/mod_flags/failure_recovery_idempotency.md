# PS-094-06 — Failure recovery and idempotency: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-06.R01** Vault commands are idempotent per CTR-IDM-001 using local idempotency keys, and mutating commands require expectedRevision.
- **PS-094-06.R02** Filing is atomic in the vault with the evidence snapshot and local outbox event; a failed capture leaves no report.
- **PS-094-06.R03** Delivery is at-least-once through the sync outbox; the relay receive command is idempotent on report id, so retries never create duplicate cases.

## Specification

- **idempotency:** Local Idempotency-Key per command; the relay stores (reporterKey, reportId) for 24 h and replays the original signed receipt; a different key for the same report returns MODERATION_REPORT_DUPLICATE.
- **concurrency:** expectedRevision on withdraw; file runs report insert, snapshot reference and outbox write in one IndexedDB transaction; two tabs filing the same report are serialized by the unique open-report index.
- **retries:** Sync outbox retries network errors and DEPENDENCY_UNAVAILABLE with CTR-IDM-001 backoff (base 500 ms, cap 30 s, 6 attempts per run, runs resume on reconnect up to 7 days); RATE_LIMITED honors retryAfterMs.
- **offline:** File and withdraw work offline and show 'saved on this device'; hide and advisory settings apply immediately; the UI never claims delivery before transport_acknowledged and never claims acceptance before peer_accepted.
- **partial failure:** If the relay accepts the report but the receipt is lost, the retry returns the stored receipt; if the relay is down the report remains prepared and exportable; no state is shared across vaults beyond signed statements.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T09 | integration | PS-094-06.R01, PS-094-06.R02, PS-094-06.R03 | duplicate relay delivery with same report id; receipt lost then retried | one case; original signed receipt replayed |
| TEST-PS-094-09.T10 | integration | PS-094-03.R02, PS-094-06.R03 | relay offline for 8 days then back | UI shows not delivered after 7 days; manual resend reaches transport_acknowledged |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
