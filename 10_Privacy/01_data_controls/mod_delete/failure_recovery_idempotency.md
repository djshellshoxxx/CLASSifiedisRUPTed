# PS-077-06 — Failure recovery and idempotency: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-06.R01** Request and cancel are idempotent per CTR-IDM-001 using vault command IDs and expectedRevision.
- **PS-077-06.R02** Every execution step is idempotent and its state is persisted, so a crash or closed tab resumes where it stopped.
- **PS-077-06.R03** A failure never leaves a half-deleted principal unannounced; failed state is visible and retried every 6 hours.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; steps keyed by (requestId, moduleId, step); relay_apply keyed by (did, requestId, batch hash) and safe to replay; the same key with different content is refused.
- **concurrency:** Partial unique index allows one active request per vault; Web Lock privacy-delete during execution; other tabs show read-only mode and the guard refuses new publishing with PRIVACY_DELETION_PENDING.
- **retries:** Steps retry up to 8 times with 1 s, 5 s, 30 s and 5 min backoff then every 6 h; signed statements are delivered by the sync outbox (F15.S01.M01), whose pending entries move to the residue store at completion and keep retrying 5 s, 30 s, 5 min, 1 h, then every 6 h for 30 days after signing, the same window in which relays accept them.
- **offline:** Request and cancel work offline; execution proceeds locally offline and queues relay statements; completion shows relays as prepared until acknowledged.
- **partial failure:** Order of steps is sign (all modules), revoke_keys, pseudonymize, shred, purge, destroy_keys last. If a step fails, earlier steps stay done and the request is failed and retried; nothing is signed after revoke_keys, and keys are destroyed only when every earlier step is done.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T04 | integration | PS-077-03.R03, PS-077-06.R02, PS-077-06.R03 | kill the app after each step and reopen | execution resumes from persisted state; keys destroyed only after all earlier steps done |
| TEST-PS-077-09.T09 | integration | PS-077-06.R01 | replay same command ID; offline execution with an offline relay | original result; completion with relay shown prepared |
| TEST-PS-077-09.T23 | integration | PS-077-01.R04, PS-077-06.R01 | relay offline at execution returns on day 3, a second relay returns on day 29, a third never returns | residue outbox delivers on day 3 and day 29 and both relays accept; the third entry is dropped after 30 days and the summary shows it never acknowledged |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
