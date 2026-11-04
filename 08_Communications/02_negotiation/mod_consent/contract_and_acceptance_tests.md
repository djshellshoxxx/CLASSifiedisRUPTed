# PS-062-09 — Contract and acceptance tests: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-062-09.R02** Contract tests verify signed statements, command inputs and outputs and events against the schema registry, using fixed known-answer vectors for JCS and Ed25519.
- **PS-062-09.R03** Owning modules reuse a shared conformance suite that exercises sign and verify against their own canonicalizer.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults P1, P2, P3 with Ed25519 device keys from fixed seeds, mutiny cycle subject at revisions 1..3, statement key registry with consent.mutiny.cycle.commit.v1 and consent.comms.meetup.agree.v1, fixed clock 2026-11-04T10:00:00Z, RFC 8785 test vectors.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 and recompute bytes independently with JCS and the domain prefix | signature equals known-answer vector and verifies; payload fields complete |
| TEST-PS-062-09.T02 | unit | PS-062-02.R02, PS-062-02.R03 | each rule V01 to V09 violated in turn | documented error code returned and nothing stored |
| TEST-PS-062-09.T03 | property | PS-062-01.R03, PS-062-03.R01 | random sequences of sign, revoke, accept, subject revisions | revoked never returns to valid; id equals cid; verify result depends only on stored statements |
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by domain separation |
| TEST-PS-062-09.T05 | integration | PS-062-03.R02, PS-062-03.R03 | consent arrives before subject; later subject arrives; and a decline plus consent by one signer | first becomes valid after subject; second returns verify conflicted and neither wins by claimed time |
| TEST-PS-062-09.T06 | contract | PS-062-04.R01, PS-062-04.R02, PS-062-04.R03, PS-062-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-062-09.T07 | abuse | PS-062-05.R01, PS-062-05.R02, PS-062-05.R03 | non-party signs; statement signed by key not in device list; relay tries to store or alter a consent | FORBIDDEN or quarantine; relay holds only encrypted envelopes |
| TEST-PS-062-09.T08 | integration | PS-062-06.R01, PS-062-06.R02, PS-062-06.R03 | sign twice, accept the same statement five times in shuffled order with subject arriving late | one record, one event per origin, same verify result |
| TEST-PS-062-09.T09 | integration | PS-062-06.R03, PS-062-03.R01 | two signer devices sign and revoke concurrently | both stored, verify returns revoked, no overwrite |
| TEST-PS-062-09.T10 | abuse | PS-062-07.R01, PS-062-07.R02, PS-062-07.R03 | clock claim 3 days off; 21st statement on one subject; inspect exported records | clockSuspect true, RATE_LIMITED, no subject content in any record |
| TEST-PS-062-09.T11 | load | PS-062-08.R01, PS-062-08.R02, PS-062-08.R03 | sign 200 statements and verify 1 000 | budgets met |
| TEST-PS-062-09.T12 | unit | PS-062-09.R01, PS-062-09.R03 | traceability tool run and shared conformance suite for bazaar, mutiny, services, rentals canonicalizers | every PS-062 requirement maps to a passing test |
| TEST-PS-062-09.T13 | integration | PS-062-10.R01, PS-062-10.R02, PS-062-10.R03 | export, import into fresh vault, restore from backup | statements round trip byte identical and re-verify; tampered file entries are rejected |
| TEST-PS-062-09.T14 | a11y | PS-062-04.R01 | confirm sheet with screen reader and keyboard | wording readable, Sign disabled until confirmation, verification result announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- Known-answer vectors for JCS bytes and Ed25519 signatures pass on all supported browsers and Node.
- No code path orders consent against revocation or decline by claimed time.
- The sign sheet states that consent evidences assertion, not delivery or payment, and that pseudonymity is not anonymity.

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
