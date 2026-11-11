# PS-091-02 — Validation rules: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-02.R01** Peer input is validated strictly; unknown fields are rejected and URLs are checked on every connection, not only at creation.
- **PS-091-02.R02** Activation needs verified statements from both sides (for a selected relay, the relay's signed identity and hosting-policy statement) and a recorded fingerprint confirmation.
- **PS-091-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-091-02.R04** Unsolicited peer offers are bounded; each is at most 8 KiB, at most 5 per day are accepted per source IP prefix and per relay id, each is verified before it is stored, and unanswered ones expire after 14 days.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | baseUrl is https on port 443, host resolves to public addresses only (no loopback, link-local or private ranges), no redirects to other hosts | FEDERATION_PEER_URL_INVALID |
| V02 | relayKey is a did:key Ed25519 and the relay_identity statement from baseUrl is signed by that key | FEDERATION_KEY_MISMATCH |
| V03 | at most 200 peers per tenant and relayId not already present (an inbound offer for an existing outbound proposal merges instead) | FEDERATION_PEER_LIMIT |
| V04 | peer_accept statement is signed by the pinned relayKey of the accepting relay and references the offerStatementCid of this Peer | FED_SIGNATURE_INVALID |
| V05 | fingerprintConfirmed is true before activation | PRECONDITION_FAILED |
| V06 | quota values within the documented ranges | VALIDATION_FAILED |
| V07 | rotation statement signed by the current key with newKey and effective time within 7 days; the previous key is accepted only until previousKeyUntil | FEDERATION_KEY_MISMATCH |
| V08 | inbound peer offer or accept body ≤ 8192 bytes | PAYLOAD_TOO_LARGE |
| V09 | inbound peer offers: at most 5 per day per source IP prefix (/24 or /48) and per offering relay id, through F12.S03.M03 RateLimitPort | RATE_LIMITED |
| V10 | inbound peer offer is self-signed by the relayKey it names, its targetRelayId is this relay and its baseUrl passes V01 | FED_SIGNATURE_INVALID |
| V11 | at most 5 selected relays per vault are listed in the identity document | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T02 | unit | PS-091-02.R01, PS-091-02.R03 | each rule V01–V11 violated | documented error code and no Peer created or changed |
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T04 | abuse | PS-091-02.R02, PS-091-09.R02 | peer presents different key with and without rotation statement | mismatch refused and suspended; valid rotation accepted for the 7-day overlap |
| TEST-PS-091-09.T13 | abuse | PS-091-02.R04, PS-091-07.R03 | 11 outbound proposals in an hour; 6 inbound offers in a day from one /24; an 8193-byte offer; an offer self-signed by a different key; quota breach 10 times | rate limit on the 11th and the 6th, PAYLOAD_TOO_LARGE, FED_SIGNATURE_INVALID with nothing stored; health reduced by 2 per 10 breaches |
| TEST-PS-091-09.T20 | integration | PS-091-02.R02, PS-091-03.R04 | vault selects relay R: fetch and verify its relay_identity statement, user confirms fingerprint; then a tampered identity statement | active without any per-user accept; the tampered one FEDERATION_KEY_MISMATCH |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
