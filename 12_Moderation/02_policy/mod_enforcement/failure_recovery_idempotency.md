# PS-096-06 — Failure recovery and idempotency: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-096-06.R02** Apply, statement storage and outbox event commit in one relay transaction; delivery to the subject is at-least-once.
- **PS-096-06.R03** Case intake from events is idempotent via the inbox table so duplicates never create two cases.
- **PS-096-06.R04** A host-policy record is idempotent on (caseSource, hostRef) for as long as the action is retained and commits in the hosting module's transaction, so a retried or crashed confirm never records a second action.

## Specification

- **idempotency:** Idempotency-Key required on all relay commands; replay returns the stored response for 24 h; case intake dedupes on (consumer, eventId) and on receiptId; record_host_policy dedupes on (tenantId, caseSource, hostRef) for the life of the action and returns the stored actionId with created false; vault intake of statements dedupes on statement cid.
- **concurrency:** expectedRevision on every mutation; partial unique index allows one open case per target; apply uses BEGIN IMMEDIATE and checks case revision so conflicting actions return CONFLICT_REVISION; an appeal outcome reduced writes the revert and the replacement in one transaction.
- **retries:** Subject notice delivery to the mailbox retries with CTR-IDM-001 backoff for 24 h; command callers retry DEPENDENCY_UNAVAILABLE only; the subject vault refetches statements through get_mine.
- **offline:** Moderation commands require the relay online; nothing here is queued by a vault except the intake of statements, which the vault verifies whenever it next syncs.
- **partial failure:** If the index check fails, the transaction aborts with DEPENDENCY_UNAVAILABLE and the action is not recorded; if notice delivery fails, the action stays pending_notice for at most 24 h and the statement remains retrievable. Privacy ports (N6): ExportSectionPort, DeletionPort and RetentionPurgePort run resumably per action id.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T07 | integration | PS-096-04.R02, PS-096-06.R03 | moderation.report.received delivered twice; a second report on the same target; spam.detected score 79 and 80; risk.elevated high | one case with source report, both receipts attached and link_case called once per receipt; 79 adds signals only, 80 opens or extends a case for subjectKey; risk case has source risk_review and targetType account |
| TEST-PS-096-09.T10 | integration | PS-096-06.R01, PS-096-06.R02, PS-096-09.R03 | same Idempotency-Key replayed; two moderators apply concurrently | original response replayed; one succeeds, other CONFLICT_REVISION |
| TEST-PS-096-09.T11 | chaos | PS-096-06.R02, PS-096-06.R03 | index check fails mid-apply | no action row, no event, DEPENDENCY_UNAVAILABLE |
| TEST-PS-096-09.T28 | chaos | PS-096-06.R04, PS-096-02.R05 | record_host_policy retried with the same hostRef after a crash before commit and after a successful commit; the auction document already left the index at close | one action only, the retry returns the stored actionId with created false; the record is accepted without NOT_FOUND and the index effect is a no-op |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
