# PS-091-02 — Validation rules: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-02.R01** Peer input is validated strictly; unknown fields are rejected and URLs are checked on every connection, not only at creation.
- **PS-091-02.R02** Activation needs verified statements from both sides and a recorded fingerprint confirmation.
- **PS-091-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | baseUrl is https on port 443, host resolves to public addresses only (no loopback, link-local or private ranges), no redirects to other hosts | FEDERATION_PEER_URL_INVALID |
| V02 | relayKey is a did:key Ed25519 and the identity statement from baseUrl is signed by that key | FEDERATION_KEY_MISMATCH |
| V03 | at most 200 peers per tenant and relayId not already present | FEDERATION_PEER_LIMIT |
| V04 | peer_accept statement is signed by the pinned relayKey and references the offer cid | FED_SIGNATURE_INVALID |
| V05 | fingerprintConfirmed is true before activation | PRECONDITION_FAILED |
| V06 | quota values within the documented ranges | VALIDATION_FAILED |
| V07 | rotation statement signed by the current key with newKey and effective time within 7 days | FEDERATION_KEY_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T02 | unit | PS-091-02.R01, PS-091-02.R03 | each rule V01–V07 violated | documented error code and no Peer created or changed |
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T04 | abuse | PS-091-02.R02, PS-091-07.R03 | peer presents different key with and without rotation statement | mismatch refused and suspended; valid rotation accepted for 7 day overlap |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
