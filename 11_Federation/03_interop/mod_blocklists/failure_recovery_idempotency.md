# PS-089-06 — Failure recovery and idempotency: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-089-06.R02** Imports are all-or-nothing so a failed import leaves no partial pending rules.
- **PS-089-06.R03** Evaluation uses an in-memory snapshot refreshed in the same transaction as every rule change, so a restart cannot lose an active rule.

## Specification

- **idempotency:** Idempotency-Key on all commands (24 h replay); importing the same list cid twice returns the first result; a second identity.block.added for the same DID keeps the existing personal_block rule.
- **concurrency:** expectedRevision per rule; unique index on (tenant, type, value); a batch uses one rule snapshot taken at its start.
- **retries:** Local commands are not retried automatically; the sync of a published list is delivery's concern.
- **offline:** All rule management works offline in the vault; relay policy changes need the relay to be reachable.
- **partial failure:** If purging or hiding mirrors after a rule change fails, the rule keeps its new state, federation.block_rule.changed is re-delivered from the outbox, and the sweep in F11.S01.M02 retries until the 24 h purge deadline; hide and unhide never purge, so a failed unhide leaves records hidden rather than lost.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T05 | integration | PS-089-04.R04, PS-089-04.R02, PS-089-06.R03 | reject rule on author Bad with 5 mirrors present; hide rule on author Z with 3 mirrors, disabled an hour later; later tombstone and move statements from Bad | Bad's mirrors purged within 1 h (dropped); Z's mirrors hidden then accepted with envelopes intact; Bad's tombstone and move are processed |
| TEST-PS-089-09.T09 | integration | PS-089-06.R01, PS-089-06.R02 | replay import with same key; kill import midway | first response replayed; no partial pending rules |
| TEST-PS-089-09.T10 | integration | PS-089-06.R03 | rule added while a batch is in flight | batch uses start snapshot; next batch applies the rule |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
