# PS-052-07 — Privacy, retention and abuse: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-07.R01** The vault holds no email, phone, real name or password for the account; the pseudonym is a public label and the DID a stable pseudonymous identifier, which is not anonymity.
- **PS-052-07.R02** Private keys never leave the device unencrypted; the relay never sees them and the recovery kit is separate (F07.S01.M03).
- **PS-052-07.R03** Pseudonym checks never reveal which existing handle a candidate collides with beyond the reason code, except a local warning naming a contact the user already knows.

## Specification

**Data classification**
- Account: P0 public (did, pseudonym); DeviceKey: P3 (labels, last-used day); keystore blobs: P4 in the kernel keystore.
- HandleRegistration: P0 on the relay that holds it; claims are signed statements.

**Retention**
- Account and DeviceKey until vault erase (RET-STANDARD); revoked key records kept so old signatures remain verifiable.
- Released handles reserved 30 days then purged; relay request counters 24 h (RET-EPHEMERAL).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Homoglyph impersonation of a known pseudonym | NFKC, Highly Restrictive script rule, UTS #39 skeleton equality check on a relay registry and local contact-confusable warning on every display |
| T02 | Squatting or impersonation by claiming a recently changed handle | released handles reserved 30 days for the former DID, 30 day change cooldown per DID on a registry |
| T03 | Mass creation of identities (Sybil, Douceur 2002) | creating a DID costs nothing and cannot be prevented without a central authority; relays can set claim rate limits and allowlists, and reputation dampens new identities (F07.S03.M01); the spec makes no uniqueness-of-person claim |
| T04 | Stolen device keeps acting after revocation | signed revocation statement distributed via the identity document; verifiers accept signatures made before they learn of the revocation, which is an explicit limit |
| T05 | Malicious link statement adds an attacker's device | link requires a signature from an active key and is valid 10 minutes; the UI shows the new device label and fingerprint for confirmation |
| T06 | Weak vault passphrase enables offline guessing of the keystore blob | scrypt N=2^17, r=8, p=1, strength meter requiring at least 12 characters or 4 words, honest text that a stolen device file can be attacked offline |

**Abuse controls**
- Relay registry limits - 5 claims per hour per IP /24 and 3 per 24 h per DID, 20 availability checks per minute per caller; relays may require an invite token by policy.
- Vault limits - 3 pseudonym change attempts per 24 h, 5 device link attempts per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T12 | abuse | PS-052-07.R01, PS-052-07.R02, PS-052-07.R03 | scan storage, logs and exports of other users for private keys, emails and passwords; 6 claims in an hour from one IP /24 | none found; 6th claim RATE_LIMITED |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
