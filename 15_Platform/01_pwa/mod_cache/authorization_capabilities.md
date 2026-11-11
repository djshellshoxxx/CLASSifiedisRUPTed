# PS-114-05 — Authorization and capabilities: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-05.R01** The worker holds no credentials and attaches none; relay access tokens are added only by page code to relay commands and pass through NetworkOnly untouched, and vault data never enters Cache Storage.
- **PS-114-05.R02** The module defines no capabilities because it performs no vault commands or relay operations; access to user data is governed by vault policy (CTR-CAP-001 CAP-8), and relays authorize only their own resources using relay access tokens (CAP-8 to CAP-10).
- **PS-114-05.R03** Only same-origin controlled windows may send control messages; vault lock, principal switch and Erase vault each send CLEAR_USER_CACHES, which unbinds the principal's image partition (lock, principal switch) or deletes it (Erase vault).

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T08 | abuse | PS-114-05.R01, PS-114-05.R02, PS-114-07.R01 | unlock vault, call a relay query with a relay access token, open a mailbox and private media, then inspect all Cache Storage keys | no relay command, mailbox or private media entry and no Authorization-bearing request cached; no vault data in Cache Storage |
| TEST-PS-114-09.T09 | abuse | PS-114-05.R03, PS-114-07.R02 | P1 views 5 images, vault locks; P2 unlocks and views 2; P1 unlocks and runs Erase vault | after lock P1's partition is not served; P2 sees only its own 2 entries; erase deletes P1's partition; P2's partition intact |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
