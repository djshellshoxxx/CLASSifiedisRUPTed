# PS-057-07 — Privacy, retention and abuse: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-07.R01** No KYC or contact data is stored; the relay_verified_email attestation records only that the operator checked something on a date, never the email address.
- **PS-057-07.R02** Attestations are evidence that a signer asserted a claim; the UI never states that a claim is true, and a signer can be a stranger or a throwaway DID.
- **PS-057-07.R03** Subjects control visibility of claims about themselves, but cannot erase another person's signed statement from other vaults.

## Specification

**Data classification**
- TrustAttestation: P1 when public; subject-only deliveries are end-to-end encrypted (P2); claim labels are free text with a 80 code point limit.
- Operator check notes: at most 140 code points, kept on the relay in audit logs for RET-AUDIT (1 year), never containing the email.

**Retention**
- RET-EVIDENCE (2 years after last related activity) for attestations; revoked and expired kept as history for the same period; local quarantined items 30 days.
- On vault erase all local attestations are deleted; copies in other vaults and relays remain until signed tombstones arrive.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attestation mistaken for proof of truth or identity | wording 'Signed by X; this shows they said so', issuer always shown with pseudonym and DID fingerprint, no checkmark icon implying verification |
| T02 | Sybil attestation rings (Douceur 2002) where throwaway DIDs vouch for each other | attestations have no numeric reputation effect in MVP, new signers are labelled, per-issuer limit of 10 per 24 h, pairs limited to one active peer attestation |
| T03 | Operator misuse or key compromise of relay_verified_email | claims only say this relay vouched, signature binds the relay key, key retirement notice marks attestations 'signer key retired', viewers can choose to hide a relay's attestations |
| T04 | Harassing or defamatory labels about a person | subject can hide them from their own profile, report to relay hosting policy, viewers can hide locally; honest limit - the statement can remain elsewhere |
| T05 | Label impersonates an official verification | reserved-word filter for self-claims and a fixed visual style for self-declared items |
| T06 | Stale or expired claims relied upon | expiry capped per kind and anchored on local first-seen time, last-checked time shown for revocations |

**Abuse controls**
- Issuer limit 10 attestations per 24 hours; vault intake 100 attestations per hour per transport source; 20 displayed active attestations per subject.
- Operator issue_relay limited to 100 per day per relay and every issuance logged with operator role and subject DID only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T09 | abuse | PS-057-07.R01, PS-057-07.R02, PS-057-07.R03 | inspect all storage, logs and events for emails, phones and documents; relay issue note containing an email address | none stored; note with an email-like string rejected |
| TEST-PS-057-09.T10 | abuse | PS-057-07.R03, PS-057-02.R03 | throwaway DID issues 11 attestations in 24 hours and a ring of 5 DIDs vouch for each other | RATE_LIMITED on the 11th; no numeric trust effect and new-signer labels shown |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
