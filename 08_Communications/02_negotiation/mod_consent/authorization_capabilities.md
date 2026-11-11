# PS-062-05 — Authorization and capabilities: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-05.R01** Vault policy lets only the unlocked local principal sign or revoke, and only as a party of the subject; the private key never leaves the device or the platform key store.
- **PS-062-05.R02** Inbound statements are accepted only when signed by a key that F16.S02.M02 reports active for the signer at first-seen time and the signer holds the role required by the statement key in the subject; others are quarantined with a reason.
- **PS-062-05.R03** Verify and list are local reads with no network access; relays hold no consent data except as opaque encrypted envelopes and cannot create or alter a consent.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.consent.sign | local principal | vault policy; party of the subject with the role required by the statement key (ConsentSubjectPort.partyRole); readConfirmed true |
| comms.consent.revoke | local principal | the targeted consents are signed by the local principal; subject not committed (ConsentSubjectPort.isCommitted false) |
| comms.consent.accept | local principal | internal; invoked by the transport layer; statement verified before storage |
| comms.consent.verify | local principal | any local module; pure read |
| comms.consent.read | local principal | party of the subject |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T07 | abuse | PS-062-05.R01, PS-062-05.R02, PS-062-05.R03 | non-party signs; statement signed by a key F16.S02.M02 does not list for the signer; relay tries to store or alter a consent | FORBIDDEN or quarantine; relay holds only encrypted envelopes |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
