# PS-094-06 — Failure recovery and idempotency: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-06.R01** Vault commands are idempotent per CTR-IDM-001 using local idempotency keys, and mutating commands require expectedRevision.
- **PS-094-06.R02** Filing is atomic in the vault with the evidence snapshot and local outbox event; a failed capture leaves no report.
- **PS-094-06.R03** Delivery is at-least-once through the sync outbox; the relay deduplicates on reportId for as long as it retains the report and returns the stored signed receipt for a retry with the same statement digest, so retries never create duplicate cases.

## Specification

- **idempotency:** Local Idempotency-Key per vault command. On the relay the IDM-1 24 h key cache serves only HTTP replays; report dedupe on (relayId, reportId) lasts as long as the relay retains the report: same reportId and statementDigest returns the stored signed receipt, same reportId with a different digest returns IDEMPOTENCY_KEY_REUSED, and a different reportId for the same open (reporterKey, targetType, targetId, reasonCode) returns MODERATION_REPORT_DUPLICATE with params.reportId.
- **concurrency:** expectedRevision on withdraw; file runs report insert, snapshot reference and outbox write in one IndexedDB transaction; two tabs filing the same report are serialized by the unique open-report index; relay receive inserts the copy, receipt and event in one transaction under BEGIN IMMEDIATE.
- **retries:** Sync outbox retries network errors and DEPENDENCY_UNAVAILABLE with CTR-IDM-001 backoff (base 500 ms, cap 30 s, 6 attempts per run, runs resume on reconnect up to 7 days); RATE_LIMITED honors retryAfterMs; the vault polls moderation.report.status_for_reporter every 6 h while a report is filed or linked and online.
- **offline:** File and withdraw work offline and show 'saved on this device'; hide and advisory settings apply immediately; the UI never claims delivery before transport_acknowledged and never claims acknowledgement before peer_accepted.
- **partial failure:** If the relay accepts the report but the receipt is lost, the retry returns the stored receipt at any later day; if a link or outcome statement is lost in the mailbox, the status query returns it; if the relay is down the report remains prepared and exportable; no state is shared across vaults beyond signed statements. Privacy ports (N6): ExportSectionPort, DeletionPort and RetentionPurgePort run resumably and idempotently per report id.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T09 | integration | PS-094-06.R01, PS-094-06.R03 | same local Idempotency-Key replayed on file; withdraw with a stale expectedRevision; duplicate relay delivery with the same reportId; receipt lost and retried on day 3; same reportId with a changed digest | stored response replayed; CONFLICT_REVISION; one case; the original signed receipt returned on day 3; IDEMPOTENCY_KEY_REUSED for the changed digest |
| TEST-PS-094-09.T10 | integration | PS-094-03.R02, PS-094-06.R03 | relay offline for 8 days then back | UI shows not delivered after 7 days; manual resend reaches transport_acknowledged then peer_accepted |
| TEST-PS-094-09.T24 | chaos | PS-094-06.R02, PS-094-04.R02 | evidence blob write fails during file | no Report row, no outbox entry, no moderation.report.filed, MODERATION_EVIDENCE_FAILED returned |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
