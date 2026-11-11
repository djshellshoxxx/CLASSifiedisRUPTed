# PS-057-05 — Authorization and capabilities: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-05.R01** Vault policy - only the unlocked principal issues or revokes attestations under its own DID and endorses, co-signs or sets visibility of claims about itself; received attestations are accepted only on a valid signature by an active key of the stated issuer.
- **PS-057-05.R02** Relay policy - only the operator role of a relay can issue relay_email_check attestations, signed with that relay's key and naming the relay origin; the attestation means only that this relay's operator says it checked an email, and viewers choose which relays they trust.
- **PS-057-05.R03** Viewing follows the subject's visibility and endorsement; non-self claims are issued subject-only and are shown publicly only when the subject republished them with an endorsement countersignature, and private attestations are never included in published or shared profile statements.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.attestation.issue | principal | unlocked principal; issuer DID equals the principal DID; subject not blocked; non-self kinds subject_only |
| identity.attestation.receive | principal | signature verifies against an active key of the issuer or the relay key set; issuer not blocked (otherwise dropped silently) |
| identity.attestation.endorse | principal | unlocked principal and attestation.subjectDid equals the principal DID |
| identity.attestation.revoke | principal | unlocked principal and attestation.issuerDid equals the principal DID |
| identity.attestation.set_visibility | principal | unlocked principal and attestation.subjectDid equals the principal DID |
| identity.attestation.issue_relay | operator | operator role on this relay and relay signing key available; delivered only to the subject |
| identity.attestation.read_view | principal, anonymous | vault - unlocked principal; relay copies - public endorsed attestations only |
| identity.attestation.read_issued | principal | unlocked local principal |
| identity.attestation.read_linkage | principal, operator | vault - unlocked principal or in-process modules; relay - the host relay's anti-shill checks over public same_owner attestations it stores (N11) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T07 | abuse | PS-057-05.R01, PS-057-05.R02, PS-057-05.R03 | non-operator issues a relay attestation; non-issuer revokes; stranger reads a private attestation; issuer publishes a public peer claim without endorsement | FORBIDDEN or NOT_FOUND; private claim never exposed; viewers store the unendorsed claim but do not display it |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
