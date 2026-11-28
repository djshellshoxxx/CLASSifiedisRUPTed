# PS-046-06 — Failure recovery and idempotency: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-06.R01** Saved search commands are idempotent and use expectedRevision; queries are side-effect free.
- **PS-046-06.R02** A relay failure never blocks local results and never loses a saved search.
- **PS-046-06.R03** Match evaluation is restartable and alerts at most once per (savedSearchId, documentId), because only documents first seen after the watermark alert and replays are keyed by that pair.

## Specification

- **idempotency:** Vault commands carry an Idempotency-Key kept in the local command log for 24 h; a different body with the same key returns IDEMPOTENCY_KEY_REUSED; the matched event is keyed by (savedSearchId, documentId) so a replay is a no-op.
- **concurrency:** One IndexedDB transaction per command and per evaluation batch; revision check on update and delete; two tabs of the same vault serialize through the Web Locks API; the pull scheduler holds a Web Lock so only one tab pulls.
- **retries:** Relay queries and pulls retry only on network errors and RATE_LIMITED with base 500 ms, cap 30 s, full jitter, max 6 attempts; local queries are not retried.
- **offline:** Everything except the relay section and the pull works offline; creating or editing saved searches is local and immediate.
- **partial failure:** If the relay returns an error after local results rendered, the local section stays and the relay section shows its error code; items that fail verification are dropped and counted; evaluation of saved searches that fails for one search is retried separately and does not block others.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T07 | integration | PS-046-04.R03, PS-046-06.R03 | index event for a document matching two saved searches delivered twice, then the document edited, then op rebuilt, and a document first seen before the watermark | one matched event per search; no alert after edit or rebuild; none for the pre-watermark document even after its id was trimmed from matchedDocIds |
| TEST-PS-046-09.T10 | integration | PS-046-06.R01, PS-046-06.R02 | same Idempotency-Key replayed; relay times out after local results | original response replayed; local section shown with relay section DEPENDENCY_UNAVAILABLE |
| TEST-PS-046-09.T12 | integration | PS-046-04.R04, PS-046-06.R02 | local and relay return the same listing, the relay copy with a higher verified sourceRevision | one card in the local section with both provenance labels and the newer verified content; the relay projection passed to federation.record.receive |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
