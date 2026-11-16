# PS-057-09 — Contract and acceptance tests: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-057-09.R02** Signature tests include tampering, wrong issuer and wrong kind negative cases.
- **PS-057-09.R03** Privacy tests prove that no email, phone or document data is stored anywhere in the module.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P, peers Q and R, relay operator key O, new throwaway DID Z, fixed clock 2026-11-04T10:00:00Z, label corpus (valid, with links, with reserved words).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T01 | unit | PS-057-01.R01, PS-057-01.R02, PS-057-02.R01 | issue a self_claim and a peer_met_in_person | statements signed and verify; fields match; no personal data fields exist |
| TEST-PS-057-09.T02 | unit | PS-057-02.R01, PS-057-02.R02, PS-057-02.R03 | tampered label, issuer equals subject for a peer claim, relay kind signed by a non-relay key, label with a link, label 'Verified by police' | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID or VALIDATION_FAILED |
| TEST-PS-057-09.T03 | unit | PS-057-01.R03, PS-057-02.R03 | claimedExpiresAt 10 years ahead | effectiveExpiresAt clamped to 365 days (180 for peer) after first seen |
| TEST-PS-057-09.T04 | property | PS-057-03.R01, PS-057-03.R02, PS-057-03.R03 | random sequences of receive, revoke, expire, re-issue | only declared transitions succeed; revoked and expired are final; re-issue creates a new record |
| TEST-PS-057-09.T05 | integration | PS-057-03.R02, PS-057-06.R03 | revocation received after the subject republished the claim | viewer marks revoked with lastChecked time; subject's copy shows revoked on next sync |
| TEST-PS-057-09.T06 | contract | PS-057-04.R01, PS-057-04.R02, PS-057-04.R03, PS-057-09.R02 | all commands, queries and events run | outputs, statements and payloads validate against registry schemas; signatures verify |
| TEST-PS-057-09.T07 | abuse | PS-057-05.R01, PS-057-05.R02, PS-057-05.R03 | non-operator issues relay attestation; non-issuer revokes; stranger reads private attestation | FORBIDDEN or NOT_FOUND; private claim never exposed |
| TEST-PS-057-09.T08 | chaos | PS-057-06.R01, PS-057-06.R02, PS-057-06.R03 | duplicate delivery, offline revoke, signing failure | one record; revoked locally with honest outbox state; nothing stored on failed signing |
| TEST-PS-057-09.T09 | abuse | PS-057-07.R01, PS-057-07.R02, PS-057-07.R03 | inspect all storage, logs and events for emails, phones and documents; relay issue note containing an email address | none stored; note with an email-like string rejected |
| TEST-PS-057-09.T10 | abuse | PS-057-07.R03, PS-057-02.R03 | throwaway DID issues 11 attestations in 24 hours and a ring of 5 DIDs vouch for each other | RATE_LIMITED on the 11th; no numeric trust effect and new-signer labels shown |
| TEST-PS-057-09.T11 | load | PS-057-08.R01, PS-057-08.R02, PS-057-08.R03 | verify 1 000 attestations and list 50 on emulated Moto G | verify p95 <= 8 ms, list p95 <= 50 ms |
| TEST-PS-057-09.T12 | a11y | PS-057-01.R01, PS-057-03.R01 | trust list and issue sheet with axe-core and keyboard only | zero serious or critical issues; signer dialog focus trap works |
| TEST-PS-057-09.T13 | unit | PS-057-09.R01, PS-057-09.R03 | traceability run over PS-057 | every requirement maps to a passing test |
| TEST-PS-057-09.T14 | integration | PS-057-10.R01, PS-057-10.R02, PS-057-10.R03 | export, import in a fresh vault, tombstone after import | statements re-verified and round-trip; tombstoned attestation becomes revoked |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- No KYC, email, phone or document data is stored or logged by this module (privacy suite).
- Every displayed attestation shows its signer and the wording that it evidences an assertion, not truth.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
