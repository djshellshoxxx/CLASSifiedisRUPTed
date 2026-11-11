# PS-062-09 — Contract and acceptance tests: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-062-09.R02** Contract tests verify signed statements, command inputs and outputs and events against the schema registry, using fixed known-answer vectors for JCS and Ed25519 under the classrup/consent/v1 envelope.
- **PS-062-09.R03** Owning modules reuse a shared conformance suite that exercises sign and verify against their own SubjectCanonicalizerPort.
- **PS-062-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults P1, P2, P3 with Ed25519 device keys from fixed seeds (P1 with two devices), mutiny cycle subject at revisions 1..3 with a stub SubjectCanonicalizerPort, stub ports for every other subjectType, the full v1 statement key registry of 01.R05 in en and de, a key status stub behind security.keyrecord.get_status, fixed clock 2026-11-04T10:00:00Z, RFC 8785 test vectors, regenerated header-form KAT bytes shared with F16.S02.M03.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 hash-only and recompute independently JCS({v, ctx, kid, alg, signedAt, payloadHash}) with payloadHash over JCS of the signed field set | signature equals the regenerated header-form known-answer vector shared with F16.S02.M03, the published header bytes and payload hash match, and verify with the payload returns accepted; payload has exactly the listed fields |
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
| TEST-PS-062-09.T12 | unit | PS-062-09.R01, PS-062-09.R03 | traceability tool run and shared conformance suite for the bazaar, mutiny, services, rentals and meetup SubjectCanonicalizerPorts | every PS-062 requirement maps to a passing test and every registered port passes |
| TEST-PS-062-09.T13 | integration | PS-062-10.R01, PS-062-10.R02, PS-062-10.R03 | export, import into fresh vault, restore from backup | statements round trip byte identical with firstSeenAt from the signed manifest and re-verify; tampered file entries are rejected |
| TEST-PS-062-09.T14 | a11y | PS-062-09.R04 | confirm sheet with screen reader and keyboard | wording readable, Sign disabled until confirmation, verification result announced, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-062-09.T15 | integration | PS-062-02.R04, PS-062-03.R03 | three vaults: P2 revokes after P1's owning module committed and before P3's committed | P1 stores it and verify returns conflicted so its module freezes; P3 verify returns revoked; a local revoke on the committed subject is refused with COMMS_CONSENT_NOT_REVOCABLE |
| TEST-PS-062-09.T16 | abuse | PS-062-04.R04 | P1 sends a consent to P2 and a decline to P3; the owning modules echo received statements to all participants before commit | both P2 and P3 hold both statements and verify returns conflicted in each |
| TEST-PS-062-09.T17 | integration | PS-062-02.R05, PS-062-10.R02 | key K of P1 revoked; a statement by K backdated before the revocation reaches P2 afterwards; P2 exports and re-imports after the revocation | the backdated statement is rejected; consents first seen before the revocation stay valid after import because firstSeenAt is restored from the manifest |
| TEST-PS-062-09.T18 | integration | PS-062-04.R05, PS-062-07.R04 | P1 deletes the account with keepEvidence true, then repeated with false | kept consents carry the pseudonym instead of signerDid; with false they are purged; copies in P2 unchanged |
| TEST-PS-062-09.T19 | unit | PS-062-02.R06 | sign and verify for a subjectType without a registered SubjectCanonicalizerPort; port reports isCommitted true; partyRole returns none | refused with VALIDATION_FAILED; local revoke refused; FORBIDDEN |
| TEST-PS-062-09.T20 | unit | PS-062-02.R02 | inbound statement with a wording version newer than the registry, then the registry updates | quarantined with wording_unknown, then valid without being re-sent |
| TEST-PS-062-09.T21 | integration | PS-062-03.R01 | P1 consents, revokes and consents again to the same revision | the second consent is a new valid record; verify returns valid |
| TEST-PS-062-09.T22 | unit | PS-062-07.R03, PS-062-07.R02 | render the sign sheet in en and de | text states that pseudonymity is not anonymity, that consent evidences assertion not delivery or payment, and that copies held by counterparties are not deleted with the vault |
| TEST-PS-062-09.T23 | contract | PS-062-01.R05, PS-062-02.R06 | load the v1 statement key registry and run sign and verify for each key against the stub port of its owner | every listed key exists with its subjectType, subjectRef kind, signer role, owning port and wording (decline wording for both mutiny keys and the booking cancel key; the deposit wording states that the owner, not ClassRup, holds the deposit); a mutiny_cycle subjectRevisionHash equals the F02.S01.M04 contentHash cid; a hex-encoded hash is refused with VALIDATION_FAILED; a partyRole other than the key's signer role is refused with FORBIDDEN |
| TEST-PS-062-09.T24 | unit | PS-062-02.R02, PS-062-01.R02 | hash-only envelope verified without its payload, with the payload of another revision, with get_status reporting revoked before firstSeenAt, and accepted with freshness unknown | the first three are not accepted and never stored valid (COMMS_CONSENT_SIGNATURE_INVALID); exactly one security.keyrecord.get_status call with at = firstSeenAt per verification; the last is stored valid with the stale-key flag |
| TEST-PS-062-09.T25 | integration | PS-062-04.R01, PS-062-04.R02 | P2's portable identity document arrives with origin received adding key K2 and revoking K1 effective at t; own identity.device_key.added carries the local did; P1 then revokes a consent | quarantined statements by K2 become valid; statements by K1 first seen after t are rejected and earlier ones stay valid; no security.key.* event is consumed; comms.consent.revoked carries subjectRevision, subjectRevisionHash and statementKey |

## Acceptance criteria

- All tests T01 to T25 pass in CI.
- Regenerated header-form known-answer vectors (JCS of {v, ctx, kid, alg, signedAt, payloadHash} and Ed25519 signatures under classrup/consent/v1) pass on all supported browsers and Node, equal the F16.S02.M03 consent vectors, and the header bytes and payload hashes are published.
- No code path orders consent against revocation or decline by claimed time.
- The sign sheet states that consent evidences assertion, not delivery or payment, and that pseudonymity is not anonymity.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F07.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
