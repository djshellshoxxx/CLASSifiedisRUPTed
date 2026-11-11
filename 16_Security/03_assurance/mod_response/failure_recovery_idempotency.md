# PS-132-06 — Failure recovery and idempotency: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-06.R01** Switches are idempotent, setting an already-set switch changes nothing and logs a no-op.
- **PS-132-06.R02** The read-only sentinel works without the database and survives restarts until removed.
- **PS-132-06.R03** Runbook steps are written so each can be repeated safely, and verification checks identify partial completion.

## Specification

- **idempotency:** Applying read-only on or federation off twice leaves the same state; the command reports changed false and still records an audit note.
- **concurrency:** Concurrent security.containment.set calls are serialized by the bus transaction that writes the sentinel and the audit entry; the last change wins, the audit log records both and the status screen shows the final state.
- **retries:** Propagation checks poll every 1 second up to 60 seconds; operators repeat the CLI if propagation fails.
- **offline:** Vault outboxes hold prepared statements during read-only or federation-off periods up to 7 days and then ask the user to resend or export.
- **partial failure:** If the database is down, the --local path writes the sentinel directly and records the change in containment/log.jsonl, from which the audit entries are appended at the next start; RB-05 can additionally block peer requests in the reverse proxy configuration documented in the runbook.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T04 | integration | PS-132-03.R05, PS-132-06.R01, PS-132-09.R02 | federation off then on twice; a request from peer P and one from hosted vault V to /fed/v1/inbox; a mailbox put and a consent statement during the kill | P gets FEATURE_DISABLED with reason federation_killed within 60 s; V's request accepted; outbound to peers paused; mailbox delivery and consent keep working; repeated toggles are no-ops with audit notes; no module flag changes |
| TEST-PS-132-09.T05 | chaos | PS-132-06.R02, PS-132-06.R03 | database down while applying read-only with --local; restart with the sentinel present; restart with RELAY_CONTAINMENT_READ_ONLY=1 after lifting | sentinel works without the database and the OS user is recorded, the audit entry is appended at the next start; read-only still active after restart; the environment value re-applies it at start with a warning |
| TEST-PS-132-09.T10 | integration | PS-132-03.R04, PS-132-06.R01 | outbox of 1 000 statements during read-only then lift | statements stay prepared; drained at 50 per second per key; none lost or duplicated |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
