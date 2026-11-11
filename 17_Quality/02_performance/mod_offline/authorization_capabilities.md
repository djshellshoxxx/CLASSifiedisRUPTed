# PS-140-05 — Authorization and capabilities: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-05.R01** Offline tests use real authorization: a queued statement signed by a key revoked while offline is quarantined by the receiving vault on arrival of the revocation and shown with a reason.
- **PS-140-05.R02** Cached data for signed-out users is cleared on logout; a test asserts IndexedDB and caches are empty after logout.
- **PS-140-05.R03** No test uses elevated service accounts.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T07 | e2e | PS-140-05.R01, PS-140-05.R03 | revoke signing key while offline then reconnect | receiver quarantines the statement; sender sees quarantined with reason |
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | logout then inspect IndexedDB and caches | all empty for the previous account |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
