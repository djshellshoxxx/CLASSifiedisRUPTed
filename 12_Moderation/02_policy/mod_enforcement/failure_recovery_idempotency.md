# PS-096-06 — Failure recovery and idempotency: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-096-06.R02** Apply, statement storage and outbox event commit in one relay transaction; delivery to the subject is at-least-once.
- **PS-096-06.R03** Case intake from events is idempotent via the inbox table so duplicates never create two cases.

## Specification

- **idempotency:** Idempotency-Key required on all commands; replay returns the stored response for 24 h; case intake dedupes on (consumer, eventId).
- **concurrency:** expectedRevision on every mutation; partial unique index allows one open case per target; apply uses BEGIN IMMEDIATE and checks case revision so conflicting actions return CONFLICT_REVISION.
- **retries:** Subject notice delivery to the mailbox retries with CTR-IDM-001 backoff for 24 h; command callers retry DEPENDENCY_UNAVAILABLE only.
- **offline:** Moderation commands require the relay online; nothing here is queued by a vault because only moderators of that relay issue them; subjects read statements when they next sync.
- **partial failure:** If the index removal port fails, the transaction aborts and the action is not recorded; if notice delivery fails, the action stays pending_notice for at most 24 h and the statement remains retrievable.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T07 | integration | PS-096-04.R03, PS-096-06.R03 | report.filed delivered twice; spam.detected score 79 and 80 | one case; 79 adds signals only, 80 opens or extends a case |
| TEST-PS-096-09.T10 | integration | PS-096-06.R01, PS-096-06.R02 | same Idempotency-Key replayed; two moderators apply concurrently | original response replayed; one succeeds, other CONFLICT_REVISION |
| TEST-PS-096-09.T11 | chaos | PS-096-06.R02, PS-096-06.R03 | index port fails mid-apply | no action row, no event, DEPENDENCY_UNAVAILABLE |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
