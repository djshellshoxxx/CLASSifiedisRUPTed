# PS-062-09 — Contract and acceptance tests: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-062-09.R02** Contract tests verify signed statements, command inputs and outputs and events against the schema registry, using fixed known-answer vectors for JCS and Ed25519 under the classrup/consent/v1 envelope.
- **PS-062-09.R03** Owning modules reuse a shared conformance suite that exercises sign and verify against their own ConsentSubjectPort.
- **PS-062-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults P1, P2, P3 with Ed25519 device keys from fixed seeds (P1 with two devices), mutiny cycle subject at revisions 1..3 with a stub ConsentSubjectPort, statement key registry with consent.mutiny.cycle.commit.v1 and consent.comms.meetup.agree.v1 in en and de, fixed clock 2026-11-04T10:00:00Z, RFC 8785 test vectors, published KAT input bytes.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 and recompute the bytes independently as classrup/consent/v1, zero byte, key-ID digest, zero byte, JCS of the signed field set | signature equals the regenerated known-answer vector, the published input bytes match, and the statement verifies; payload has exactly the listed fields |
| TEST-PS-062-09.T02 | unit | PS-062-02.R02, PS-062-02.R03 | each rule V01 to V10 violated in turn | documented error code returned and nothing stored as valid |
| TEST-PS-062-09.T03 | property | PS-062-01.R03, PS-062-03.R01 | random sequences of sign, revoke, accept, subject revisions | revoked never returns to valid; id equals cid; verify result depends only on stored statements |
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by the F16.S02.M03 context check |
| TEST-PS-062-09.T05 | integration | PS-062-03.R02, PS-062-03.R03 | consent arrives before subject; later subject arrives; and a decline plus consent by one signer | first becomes valid after subject; second returns verify conflicted and neither wins by claimed time |
| TEST-PS-062-09.T06 | contract | PS-062-04.R01, PS-062-04.R02, PS-062-04.R03, PS-062-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas; verify results follow the single result table |
| TEST-PS-062-09.T07 | abuse | PS-062-05.R01, PS-062-05.R02, PS-062-05.R03 | non-party signs; statement signed by a key F16.S02.M02 does not list for the signer; relay tries to store or alter a consent | FORBIDDEN or quarantine; relay holds only encrypted envelopes |
| TEST-PS-062-09.T08 | integration | PS-062-06.R01, PS-062-06.R02, PS-062-06.R03 | sign twice, accept the same statement five times in shuffled order with subject arriving late | one record, one event per origin, same verify result |
| TEST-PS-062-09.T09 | integration | PS-062-06.R04, PS-062-01.R04 | P1 signs the same consent on both devices; P2 and P3 receive the two copies in opposite orders; P1 then revokes by dedupe tuple | P2 and P3 both keep the lowest cid with the other as alias; the revocation revokes both cids in both vaults |
| TEST-PS-062-09.T10 | abuse | PS-062-07.R01, PS-062-07.R02, PS-062-07.R03 | clock claim 3 days off; 21st statement on one subject; inspect exported records | clockSuspect true, RATE_LIMITED, no subject content in any record |
| TEST-PS-062-09.T11 | load | PS-062-08.R01, PS-062-08.R02, PS-062-08.R03 | sign 200 statements and verify 1 000 | budgets met |
| TEST-PS-062-09.T12 | unit | PS-062-09.R01, PS-062-09.R03 | traceability tool run and shared conformance suite for the bazaar, mutiny, services, rentals and meetup ConsentSubjectPorts | every PS-062 requirement maps to a passing test and every registered port passes |
| TEST-PS-062-09.T13 | integration | PS-062-10.R01, PS-062-10.R02, PS-062-10.R03 | export, import into fresh vault, restore from backup | statements round trip byte identical with firstSeenAt from the signed manifest and re-verify; tampered file entries are rejected |
| TEST-PS-062-09.T14 | a11y | PS-062-09.R04 | confirm sheet with screen reader and keyboard | wording readable, Sign disabled until confirmation, verification result announced, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-062-09.T15 | integration | PS-062-02.R04, PS-062-03.R03 | three vaults: P2 revokes after P1's owning module committed and before P3's committed | P1 stores it and verify returns conflicted so its module freezes; P3 verify returns revoked; a local revoke on the committed subject is refused with COMMS_CONSENT_NOT_REVOCABLE |
| TEST-PS-062-09.T16 | abuse | PS-062-04.R04 | P1 sends a consent to P2 and a decline to P3; the owning modules echo received statements to all participants before commit | both P2 and P3 hold both statements and verify returns conflicted in each |
| TEST-PS-062-09.T17 | integration | PS-062-02.R05, PS-062-10.R02 | key K of P1 revoked; a statement by K backdated before the revocation reaches P2 afterwards; P2 exports and re-imports after the revocation | the backdated statement is rejected; consents first seen before the revocation stay valid after import because firstSeenAt is restored from the manifest |
| TEST-PS-062-09.T18 | integration | PS-062-04.R05, PS-062-07.R04 | P1 deletes the account with keepEvidence true, then repeated with false | kept consents carry the pseudonym instead of signerDid; with false they are purged; copies in P2 unchanged |
| TEST-PS-062-09.T19 | unit | PS-062-02.R06 | sign and verify for a subjectType without a registered ConsentSubjectPort; port reports isCommitted true; partyRole returns none | refused with VALIDATION_FAILED; local revoke refused; FORBIDDEN |
| TEST-PS-062-09.T20 | unit | PS-062-02.R02 | inbound statement with a wording version newer than the registry, then the registry updates | quarantined with wording_unknown, then valid without being re-sent |
| TEST-PS-062-09.T21 | integration | PS-062-03.R01 | P1 consents, revokes and consents again to the same revision | the second consent is a new valid record; verify returns valid |
| TEST-PS-062-09.T22 | unit | PS-062-07.R03, PS-062-07.R02 | render the sign sheet in en and de | text states that pseudonymity is not anonymity, that consent evidences assertion not delivery or payment, and that copies held by counterparties are not deleted with the vault |

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- Known-answer vectors for JCS bytes and Ed25519 signatures under classrup/consent/v1 pass on all supported browsers and Node, and the vector input bytes are published.
- No code path orders consent against revocation or decline by claimed time.
- The sign sheet states that consent evidences assertion, not delivery or payment, and that pseudonymity is not anonymity.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
