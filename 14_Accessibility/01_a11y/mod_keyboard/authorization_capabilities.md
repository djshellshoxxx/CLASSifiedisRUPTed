# PS-109-05 — Authorization and capabilities: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-05.R01** The library performs no authorization and has no roles; it runs in the browser under the unlocked local principal.
- **PS-109-05.R02** It must not read or store vault data and must not transmit anything over the network; preference values are passed in as parameters by the PWA shell.
- **PS-109-05.R03** Developer overlays are compiled out of production builds.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T08 | unit | PS-109-04.R01, PS-109-04.R02, PS-109-04.R03, PS-109-05.R01, PS-109-05.R02 | inspect module exports, DOM events, storage and network calls | no domain events, no vault, IndexedDB or network access, preference only via setMotionPreference parameter, errors are lint codes |
| TEST-PS-109-09.T18 | unit | PS-109-05.R03 | build the production bundle and search it for the overlay module and its strings | no overlay code or strings in the production bundle; the development build contains them |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
