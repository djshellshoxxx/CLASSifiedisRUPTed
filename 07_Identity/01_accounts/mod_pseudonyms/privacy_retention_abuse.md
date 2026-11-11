# PS-052-07 — Privacy, retention and abuse: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-07.R01** The vault holds no email, phone, real name or password for the account; the pseudonym is a public label and the DID a stable pseudonymous identifier, which is not anonymity.
- **PS-052-07.R02** Private keys never leave the device unencrypted; the relay never sees them and the recovery kit is separate (F07.S01.M03).
- **PS-052-07.R03** Pseudonym checks never reveal which existing handle a candidate collides with beyond the reason code and the taken flag, except a local warning naming a contact the user already knows.
- **PS-052-07.R04** The module meets the N6 privacy duties - it implements ExportSectionPort (sections identity.account and identity.device_keys), DeletionPort (plan, execute, pseudonymize) and RetentionPurgePort, classifies every field with F10.S02.M02, checks federation_publish consent through ConsentCheckPort before a handle claim, and treats privacy.deletion.completed only as final cleanup.

## Specification

**Data classification**
- Account: P0 public (did, pseudonym, fingerprint); rootKeyRef is an opaque local handle; DeviceKey: P3 (labels, last-used day); keystore blobs: P4 in the kernel keystore.
- HandleRegistration: P0 on the relay that holds it; claims and releases are signed statements.

**Retention**
- Account and DeviceKey until vault erase (RET-STANDARD); revoked key records kept so old signatures remain verifiable.
- Released handles reserved 30 days then purged; relay request counters 24 h (RET-EPHEMERAL); seen statement cids kept 30 days after the registration is purged.
- Deletion plan: release relay handles with signed releases first, then delete DeviceKey and Account rows and crypto-shred keystore handles; F10.S01.M04 destroys the keys last.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Homoglyph impersonation of a known pseudonym | NFKC, Highly Restrictive script rule, UTS 39 skeleton equality check on a relay registry and local contact-confusable warning on every display |
| T02 | Squatting or impersonation by claiming a recently changed handle | released handles reserved 30 days for the former DID, 30 day change cooldown per DID on a registry |
| T03 | Mass creation of identities (Sybil, Douceur 2002) | creating a DID costs nothing and cannot be prevented without a central authority; relays can set claim rate limits and allowlists, and reputation dampens new identities (F07.S03.M01); the spec makes no uniqueness-of-person claim |
| T04 | Stolen device keeps acting after revocation | a stolen non-root device is cut off for every verifier that has learned of the revocation, judged at the verifier's first-seen time; statements first seen earlier stay accepted, an explicit limit; a stolen root device whose passphrase is guessed, or a copied kit, can sign as the account and revocation cannot stop it, so the UI advises moving to a new identity |
| T05 | Malicious link statement adds an attacker's device | the link needs the root key and a possession signature by the new key and is valid 10 minutes; the UI shows the new device label and fingerprint for confirmation |
| T06 | Weak vault passphrase enables offline guessing of the keystore blob | scrypt N=2^17, r=8, p=1, strength meter requiring at least 12 characters or 4 words, honest text that a stolen device file can be attacked offline |
| T07 | Foreign public key listed under a DID to fake linkage (F04 anti-shill reads key linkage) | every listed key carries its own possession signature over the DID-bound message, so another user's key cannot be listed |
| T08 | Fingerprint collision to impersonate a contact | 16 base58btc characters of SHA-256 (about 93 bits) with the constant did:key prefix excluded; grinding a match is infeasible |
| T09 | Replay of handle claims across relays or of an old release after a reclaim | claims bind relayId and a claimedAt within 10 minutes, releases bind registrationId and revision, seen cids are refused |
| T10 | Stolen linked device revokes the legitimate devices | another device's revocation waits 7 days as pending, a counter-revocation makes both contested, and only the root key or the recovery kit decides |

**Abuse controls**
- Relay registry limits - 5 claims per hour per IP /24 and 3 per 24 h per DID, 20 availability checks per minute per caller; relays may require an invite token by policy. Limits run through the bus RateLimitPort (F12.S03.M03, N18).
- Vault limits - 3 pseudonym change attempts per 24 h, 5 device link attempts per hour, 10 received own-device statements per hour per source.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T12 | abuse | PS-052-07.R01, PS-052-07.R02 | scan storage, logs, events and exports for private keys, emails and passwords | none found; the root key appears only inside the encrypted keystore |
| TEST-PS-052-09.T22 | unit | PS-052-07.R03 | identity.pseudonym.check on a relay for a taken and a confusable candidate, and locally for a contact lookalike | relay output has only reason codes and taken, never the colliding handle, DID or registration id; the local warning names only a known contact |
| TEST-PS-052-09.T24 | integration | PS-052-07.R04 | F10 export section, deletion plan execution and retention sweep with stub registries; handle claim without federation_publish consent | sections identity.account and identity.device_keys exported; handles released before key destruction; privacy.deletion.completed only cleans up; claim not sent without consent |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
