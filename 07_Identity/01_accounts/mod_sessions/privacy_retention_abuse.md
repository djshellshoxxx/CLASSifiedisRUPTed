# PS-054-07 — Privacy, retention and abuse: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-07.R01** Tokens are 256-bit random values returned once, stored only as SHA-256 hashes, sent only in the Authorization header and never logged or placed in URLs.
- **PS-054-07.R02** Relays learn the DID, device public key, /24 or /48 prefix and user agent label only; they never learn the passphrase, vault key or any private key.
- **PS-054-07.R03** The vault passphrase protects against casual access and not against an attacker with a copy of the encrypted vault who can guess offline; the UI says so.
- **PS-054-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (section identity.sessions with the lock timeout preference only, never sessions), DeletionPort (end every session and delete token hashes on each known relay before keys are destroyed) and RetentionPurgePort (ended sessions after 30 days, challenges after 24 h), classifies its fields with F10.S02.M02, and treats privacy.deletion.completed only as final cleanup.

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
| T04 | Enumeration of DIDs known to a relay | real challenges for every well-formed did:key and one UNAUTHENTICATED response for every start failure, so the login endpoints are no oracle; honest limit - the relay's public document read (F07.S02.M01 identity.portable_doc.get) reveals which DIDs it hosts |
| T05 | Offline guessing of the vault passphrase from a stolen device | scrypt N=2^17, r=8, p=1 and strength requirement; the local backoff is advisory; honest warning in the UI; the user can change the passphrase |
| T06 | Stolen unlocked device | 15 minute idle lock by default, lock on hide, user can lock at once and revoke the device key from another device, which revokes its relay tokens on every known relay |
| T07 | Lock-out by filling a victim's challenge slots | caps per (DID, IP prefix) with oldest-first eviction, so an attacker only evicts its own challenges |
| T08 | Stolen device keeps relay access after revocation | vault pushes the new document and revokes the key's tokens on every known relay; relays end such tokens within 60 s of storing the document and refresh cached documents older than 1 hour at every start |

**Abuse controls**
- Relay start limits as above plus a per-relay global cap of 50 starts per second, run through the bus RateLimitPort (F12.S03.M03, N18).
- Max 20 active relay sessions per DID per relay; 5 outstanding challenges per (DID, IP prefix) and 50 per DID, with oldest-first eviction.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T10 | abuse | PS-054-01.R03, PS-054-07.R01, PS-054-07.R02, PS-054-09.R03 | scan logs, events, URLs and exports for tokens, nonces, passphrases; 11 failed starts from one IP /24 for one DID | none found; relay sees only DID, key, prefix and UA label; 11th returns RATE_LIMITED |
| TEST-PS-054-09.T20 | e2e | PS-054-07.R03, PS-054-09.R04 | UI copy check of unlock and change passphrase screens in every locale bundle | the offline-guessing warning and 'backoff is a convenience' text are present |
| TEST-PS-054-09.T21 | integration | PS-054-07.R04 | F10 export section, deletion plan and retention sweep with stub registries | section identity.sessions holds only the lock timeout; deletion ends sessions on known relays before keys are destroyed; ended sessions purged after 30 days |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
