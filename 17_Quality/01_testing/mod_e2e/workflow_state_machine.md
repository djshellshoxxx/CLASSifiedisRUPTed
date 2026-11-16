# PS-134-03 — Workflow state machine: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-03.R01** There is no entity lifecycle for the module; each journey exercises lifecycles owned by other modules.
- **PS-134-03.R02** A journey passes only if the final UI state and the relay state (queried through the API) agree.
- **PS-134-03.R03** Offline journeys walk the states online, offline-pending, reconnecting, replayed, and assert each is visible to the user.
- **PS-134-03.R04** A no-relay journey runs with all network requests aborted: first-run identity creation, local listing publish, local search, vault export and restore, and sync status displayed as local committed without claiming delivery.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T05 | e2e | PS-134-03.R01, PS-134-03.R02 | buyer makes offer, seller accepts on a second context | UI and relay state agree on accepted |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online | pending shown, then replayed once with the same Idempotency-Key; no duplicate |
| TEST-PS-134-09.T16 | a11y | PS-134-03.R03 | walk offline states with a screen-reader live region check | status changes announced via aria-live polite |
| TEST-PS-134-09.T18 | e2e | PS-134-03.R04 | block all network, create identity, publish listing locally, search, export and restore the vault | journey completes with zero network requests; status local committed; QUALITY_E2E_RELAY_REQUIRED never raised |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
