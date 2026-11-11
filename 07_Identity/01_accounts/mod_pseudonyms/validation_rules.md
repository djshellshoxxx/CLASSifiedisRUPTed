# PS-052-02 — Validation rules: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-02.R01** Pseudonyms are normalized and checked before storage using the pinned Unicode data release, with one error code per failure class.
- **PS-052-02.R02** Device key operations verify signatures over JCS bytes of the statement with domain-separated prefixes, so a signature made for one statement type never verifies as another.
- **PS-052-02.R03** Relay registry rules apply only on a relay; the vault never claims global uniqueness.
- **PS-052-02.R04** Device link statements prove possession of the new key, and handle claims and releases are bound to one relay, a fresh claim time and the current registration revision, so none of them can be replayed or reused for another DID.
- **PS-052-02.R05** Revocation signer roles are explicit - the revoked key itself or the root key take effect at once, another active device key only starts a 7 day pending period, and a revoked, pending or contested key cannot revoke.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | pseudonym after NFKC and trimming is 3..32 code points, only letters, marks, digits, underscore, hyphen and dot, no spaces, no leading or trailing separator, no two separators in a row, not all digits | IDENTITY_PSEUDONYM_INVALID |
| V02 | pseudonym passes the Highly Restrictive script rule of UTS 39 (single script, or Latin with Han plus Hiragana plus Katakana, Han plus Bopomofo, Han plus Hangul) and contains no default-ignorable, bidi control, unassigned or private-use code points | IDENTITY_PSEUDONYM_INVALID |
| V03 | skeleton is not in the reserved set (admin, administrator, moderator, support, classrup, operator, staff, official, system, root, null) | IDENTITY_PSEUDONYM_RESERVED |
| V04 | relay only - skeleton is not held by another DID in this relay's registry | IDENTITY_PSEUDONYM_TAKEN |
| V05 | relay only - skeleton is not confusable with another registered handle, which is the same skeleton test applied to the registry | IDENTITY_PSEUDONYM_CONFUSABLE |
| V06 | the last pseudonym change was at least 30 days ago (advisory in the vault, enforced by a relay registry) | IDENTITY_PSEUDONYM_COOLDOWN |
| V07 | device link statement is signed by the root key over JCS bytes with prefix classrup-device-link-auth:v1, carries a possession signature by the new key over classrup-device-link:v1:<did>:<newPublicKey>:<offerNonce>, uses an offer nonce not used before, names the new public key, and is no older than 10 minutes by the local clock | IDENTITY_LINK_INVALID |
| V08 | fewer than 10 active device keys exist | IDENTITY_DEVICE_LIMIT |
| V09 | revoking leaves at least one active device key, or RecoveryKitStatusPort.hasVerifiedKit() (implemented by F07.S01.M03) returns true | IDENTITY_LAST_DEVICE_KEY |
| V10 | signing a device link, confirming another key's revocation or resolving a contested key needs the root key, which exists only on the root device or in a decrypted recovery kit | IDENTITY_ROOT_KEY_REQUIRED |
| V11 | a revocation signed by the revoked key itself or by the root key is immediate; one signed by another active device key is recorded as revocation_pending for 7 days; one signed by a revoked, pending or contested key is refused | SECURITY_KEY_UNAUTHORIZED |
| V12 | relay only - a handle claim or release names this relay's relayId and is signed with prefix classrup-handle:v1 by a device key that KeyStatusPort reports active in the DID's portable document | UNAUTHENTICATED |
| V13 | relay only - claimedAt or releasedAt is within 10 minutes of the relay clock and the statement cid has not been accepted before | EXPIRED |
| V14 | relay only - a release names the registrationId and its current revision, so an older release cannot free a reclaimed handle | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T02 | unit | PS-052-02.R01 | pseudonym corpus - too short, 33 code points, spaces, all digits, mixed Latin and Cyrillic, RTL override, zero-width joiner | IDENTITY_PSEUDONYM_INVALID for each; valid CJK and Latin samples accepted |
| TEST-PS-052-09.T03 | property | PS-052-02.R01, PS-052-09.R02 | UTS 39 conformance vectors, confusable pairs and 10 000 random NFKC-equivalent strings | skeletons equal the vectors; equal skeletons for confusable pairs; normalization is idempotent |
| TEST-PS-052-09.T04 | unit | PS-052-02.R01 | reserved names and their homoglyph forms | IDENTITY_PSEUDONYM_RESERVED for each |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only the former DID can reclaim within 30 days; row purged after; the vault never reports global uniqueness |
| TEST-PS-052-09.T06 | integration | PS-052-03.R01, PS-052-02.R03 | change pseudonym twice within 30 days in the vault and on a registry | vault asks for confirmation and keeps the Account active with revision bumped; registry returns IDENTITY_PSEUDONYM_COOLDOWN |
| TEST-PS-052-09.T07 | unit | PS-052-01.R02, PS-052-02.R02, PS-052-02.R04 | add device with a valid dual-signed link; stale link (11 min); link signed by a device key; missing possession signature; reused offer nonce; another user's device key B1 listed under A | success first, then IDENTITY_LINK_INVALID for every other case |
| TEST-PS-052-09.T17 | abuse | PS-052-02.R02, PS-052-09.R03 | a valid signature over a device_link presented as handle_claim, as a relay login message and as a keyrevocation, and the reverse | rejected each time because the domain-separated prefixes differ |
| TEST-PS-052-09.T18 | abuse | PS-052-02.R04 | claim from relay R1 replayed to R2; old release replayed after a reclaim; claim with claimedAt 11 minutes old | UNAUTHENTICATED for the wrong relay, CONFLICT_REVISION for the old release, EXPIRED for the stale claim; registries unchanged |
| TEST-PS-052-09.T19 | abuse | PS-052-02.R05, PS-052-03.R02 | stolen A3 revokes A1 and A2 | both revocation_pending for 7 days; A1's counter-revocation of A3 makes A1 and A3 contested; a revocation signed by contested A3 is refused with SECURITY_KEY_UNAUTHORIZED; the root key decision ends the contest |
| TEST-PS-052-09.T26 | unit | PS-052-05.R04, PS-052-02.R05 | linked device A2 tries identity.device_key.add and confirms another key's revocation | IDENTITY_ROOT_KEY_REQUIRED for both; A2 can still sign routine statements and revoke itself |
| TEST-PS-052-09.T29 | unit | PS-052-04.R01, PS-052-02.R05 | identity.device_key.revoke with reason superseded for the old key after a device rotation, and a received revocation with reason account_deleted and finalCids | old key revoked with revokeReason superseded and identity.device_key.revoked carries it; the account_deleted revocation is recorded with its finalCids |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
