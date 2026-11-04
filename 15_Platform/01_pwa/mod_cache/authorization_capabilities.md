# PS-114-05 — Authorization and capabilities: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-05.R01** The worker holds no credentials and attaches none; authentication headers are added only by the page and are passed through untouched to the network.
- **PS-114-05.R02** The module defines no capabilities because it performs no relay operations; access control for data remains in the relay.
- **PS-114-05.R03** Only same-origin controlled windows may send control messages, and CLEAR_USER_CACHES is sent on sign-out before the session token is discarded.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T08 | abuse | PS-114-05.R01, PS-114-05.R02, PS-114-07.R01 | sign in, fetch listing API with Authorization, view private media, then inspect all Cache Storage keys | no entry for /api/ or /media/private/ and no Authorization-bearing request cached |
| TEST-PS-114-09.T09 | abuse | PS-114-05.R03, PS-114-07.R02 | sign out | CLEAR_USER_CACHES deletes classrup-img-v1 and the session token is discarded afterward |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
