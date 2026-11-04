# PS-134-05 — Authorization and capabilities: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-05.R01** E2E tests unlock the local vault with a generated passphrase; relay access, when selected, uses the challenge-response token flow (CTR-CAP-001 CAP-10) with generated device keys.
- **PS-134-05.R02** Authorization is tested at the UI level: statements from a non-author are shown as quarantined, a non-owner sees no accept or reject controls and a direct URL returns the not-found screen.
- **PS-134-05.R03** Test accounts and the relay are discarded after the run; no tokens are written to traces (traces redact Authorization headers).

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T08 | e2e | PS-134-05.R01, PS-134-05.R02 | login via challenge-response; non-owner opens seller controls and direct URL | no accept control; not-found screen shown |
| TEST-PS-134-09.T09 | abuse | PS-134-05.R03, PS-134-07.R02 | scan trace and DOM of public page for token, exact address canary | none found; public pages show max L2 location |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
