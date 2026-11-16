# PS-054-07 — Privacy, retention and abuse: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-07.R01** Tokens are 256-bit random values returned once, stored only as SHA-256 hashes, sent only in the Authorization header and never logged or placed in URLs.
- **PS-054-07.R02** Relays learn the DID, device public key, /24 or /48 prefix and user agent label only; they never learn the passphrase, vault key or any private key.
- **PS-054-07.R03** The vault passphrase protects against casual access and not against an attacker with a copy of the encrypted vault who can guess offline; the UI says so.

## Specification

**Data classification**
- Session: P4 for token hash and vault key (memory only); metadata P3.
- LoginChallenge: P4 nonce hash; ephemeral.

**Retention**
- Challenges 24 h after creation; ended sessions 30 days (RET-SHORT); the vault key exists only in memory while unlocked.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Replay of a captured challenge signature | nonce single use, 120 s TTL, relay and domain separation in the signed message |
| T02 | Token theft from storage on the relay | only SHA-256 hashes stored, 256-bit random tokens, idle 7 d and absolute 30 d expiry |
| T03 | Online brute force or signature-grinding | signature is Ed25519 so guessing is infeasible; limits of 10 failed starts per 15 min per (IP /24, DID) and 100 per IP /24 |
| T04 | Enumeration of DIDs known to a relay | decoy HMAC-derived challenges for unknown DIDs and uniform UNAUTHENTICATED responses |
| T05 | Offline guessing of the vault passphrase from a stolen device | scrypt N=2^17, r=8, p=1 and strength requirement; the local backoff is advisory; honest warning in the UI |
| T06 | Stolen unlocked device | 15 minute idle lock by default, lock on hide, user can lock at once and revoke relay sessions from another device |

**Abuse controls**
- Relay start limits as above plus a per-relay global cap of 50 starts per second.
- Max 20 active relay sessions per DID per relay and 5 outstanding challenges per DID.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T10 | abuse | PS-054-01.R03, PS-054-07.R01, PS-054-07.R02, PS-054-07.R03 | scan logs, events, URLs and exports for tokens, nonces, passphrases; 11 failed starts from one IP /24 for one DID | none found; 11th returns RATE_LIMITED |
| TEST-PS-054-09.T11 | abuse | PS-054-07.R03, PS-054-02.R03 | unknown DID requests challenge and starts | decoy challenge returned; start returns the same UNAUTHENTICATED as a bad signature; timing within 10 percent |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
