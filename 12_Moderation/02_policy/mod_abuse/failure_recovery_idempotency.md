# PS-095-06 — Failure recovery and idempotency: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-06.R01** Commands are idempotent per CTR-IDM-001 and mutations require expectedRevision.
- **PS-095-06.R02** Publication writes the version row, signature and event in one transaction.
- **PS-095-06.R03** Concurrent edits to the same rule serialize on version uniqueness.

## Specification

- **idempotency:** Idempotency-Key required; replay returns the stored response for 24 h; publish replay returns the same statementCid; governance drafts dedupe on (decisionCid, ruleId) and governance events on (consumer, eventId).
- **concurrency:** Unique (tenant, ruleId, version) index and expectedRevision; two drafts of the same next version conflict at publish with CONFLICT_REVISION; the in-force refresh updates the outgoing and incoming version in one write.
- **retries:** Callers retry DEPENDENCY_UNAVAILABLE only; signing failure aborts publication.
- **offline:** Operators need the relay online; vaults read cached policy statements offline and show their fetch date.
- **partial failure:** If the signing key is unavailable the transaction aborts and the draft stays draft; no unsigned published rule exists.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T08 | integration | PS-095-06.R01, PS-095-06.R02, PS-095-06.R03 | same Idempotency-Key replayed; concurrent publish; signing key unavailable | same statementCid; one wins; draft stays draft |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
