# PS-134-05 — Authorization and capabilities: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-05.R01** E2E tests unlock the local vault with a generated passphrase; relay access, when selected, uses the challenge-response token flow (CTR-CAP-001 CAP-10) with generated device keys.
- **PS-134-05.R02** Authorization is tested at the UI level: a correctly signed statement from a non-author injected into a vault is shown in the quarantine list with its reason and never as accepted, a non-owner sees no accept or reject controls and a direct URL returns the not-found screen.
- **PS-134-05.R03** Test principals, their vaults and the relay are discarded after the run; no relay access tokens are written to traces (traces redact Authorization headers).

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles. Identity is a locally created key and the vault is unlocked on the device; challenge-response yields only an optional relay access token (CAP-10), and the unlock and recovery screens are checked against CTR-UX-001 UX-5.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T08 | e2e | PS-134-05.R01, PS-134-05.R02 | unlock vault; select relay and obtain a relay access token via challenge-response; non-owner opens seller controls and a direct URL | token issued without any account; non-owner sees no accept control; direct URL shows the not-found screen |
| TEST-PS-134-09.T09 | abuse | PS-134-05.R03, PS-134-07.R02 | scan trace and DOM of public page for token, exact address canary | none found; public pages show max L2 location |
| TEST-PS-134-09.T20 | abuse | PS-134-05.R02 | inject a correctly signed acceptance by a non-author key into the buyer vault by direct file import | shown in the quarantine list with reason signer not authorized; the offer is never shown as accepted and no Deal appears |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
