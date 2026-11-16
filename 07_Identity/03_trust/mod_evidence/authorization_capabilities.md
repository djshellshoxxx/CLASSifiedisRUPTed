# PS-057-05 — Authorization and capabilities: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-05.R01** Vault policy - only the unlocked principal issues or revokes attestations under its own DID and sets visibility of claims about itself; received attestations are accepted only on a valid signature from the stated issuer.
- **PS-057-05.R02** Relay policy - only the operator role of a relay can issue relay_verified_email attestations, signed with that relay's key; the attestation means only that this relay's operator vouched, and viewers choose which relays they trust.
- **PS-057-05.R03** Viewing follows the subject's visibility; private attestations are never included in published or shared profile statements.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.attestation.issue | principal | unlocked principal; issuer DID equals the principal DID; subject not blocked |
| identity.attestation.receive | principal | signature verifies against the issuer DID; issuer not blocked |
| identity.attestation.revoke | principal | unlocked principal and attestation.issuerDid equals the principal DID |
| identity.attestation.set_visibility | principal | unlocked principal and attestation.subjectDid equals the principal DID |
| identity.attestation.issue_relay | operator | operator role on this relay and relay signing key available |
| identity.attestation.read_view | principal, anonymous | vault - unlocked principal; relay copies - public attestations only |
| identity.attestation.read_issued | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T07 | abuse | PS-057-05.R01, PS-057-05.R02, PS-057-05.R03 | non-operator issues relay attestation; non-issuer revokes; stranger reads private attestation | FORBIDDEN or NOT_FOUND; private claim never exposed |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
