# PS-052-02 — Validation rules: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-02.R01** Pseudonyms are normalized and checked before storage using the pinned Unicode data release, with one error code per failure class.
- **PS-052-02.R02** Device key operations verify signatures over JCS bytes of the statement with domain-separated prefixes.
- **PS-052-02.R03** Relay registry rules apply only on a relay; the vault never claims global uniqueness.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | pseudonym after NFKC and trimming is 3..32 code points, only letters, marks, digits, underscore, hyphen and dot, no spaces, no leading or trailing separator, no two separators in a row, not all digits | IDENTITY_PSEUDONYM_INVALID |
| V02 | pseudonym passes the Highly Restrictive script rule of UTS #39 (single script, or Latin with Han plus Hiragana plus Katakana, Han plus Bopomofo, Han plus Hangul) and contains no default-ignorable, bidi control, unassigned or private-use code points | IDENTITY_PSEUDONYM_INVALID |
| V03 | skeleton is not in the reserved set (admin, administrator, moderator, support, classrup, operator, staff, official, system, root, null) | IDENTITY_PSEUDONYM_RESERVED |
| V04 | relay only - skeleton is not held by another DID in this relay's registry | IDENTITY_PSEUDONYM_TAKEN |
| V05 | relay only - skeleton is not confusable with another registered handle, which is the same skeleton test applied to the registry | IDENTITY_PSEUDONYM_CONFUSABLE |
| V06 | the last pseudonym change was at least 30 days ago (advisory in the vault, enforced by a relay registry) | IDENTITY_PSEUDONYM_COOLDOWN |
| V07 | device link statement is signed by the account signing key or an active device key, names the new public key, and is no older than 10 minutes by the local clock | IDENTITY_LINK_INVALID |
| V08 | fewer than 10 active device keys exist | IDENTITY_DEVICE_LIMIT |
| V09 | revoking leaves at least one active device key, or a recovery kit with lastVerifiedAt exists | IDENTITY_LAST_DEVICE_KEY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T02 | unit | PS-052-02.R01, PS-052-02.R02 | pseudonym corpus - too short, 33 code points, spaces, all digits, mixed Latin and Cyrillic, RTL override, zero-width joiner | IDENTITY_PSEUDONYM_INVALID for each; valid CJK and Latin samples accepted |
| TEST-PS-052-09.T03 | property | PS-052-02.R01, PS-052-02.R02 | UTS #39 confusable pairs and 10 000 random NFKC-equivalent strings | equal skeletons for confusable pairs; normalization is idempotent |
| TEST-PS-052-09.T04 | unit | PS-052-02.R03, PS-052-02.R01 | reserved names and their homoglyph forms | IDENTITY_PSEUDONYM_RESERVED |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only former DID can reclaim within 30 days; purge after |
| TEST-PS-052-09.T06 | integration | PS-052-02.R03, PS-052-03.R01 | change pseudonym twice within 30 days in vault and on registry | vault asks confirmation; registry returns IDENTITY_PSEUDONYM_COOLDOWN |
| TEST-PS-052-09.T07 | unit | PS-052-02.R02, PS-052-02.R03, PS-052-03.R02 | add device with valid, stale (11 min), wrong-signer link; add 11th device | success then IDENTITY_LINK_INVALID and IDENTITY_DEVICE_LIMIT; revoked key cannot be re-added |
| TEST-PS-052-09.T08 | integration | PS-052-03.R02, PS-052-02.R03 | revoke last device with and without verified recovery kit | IDENTITY_LAST_DEVICE_KEY without kit; allowed with kit |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
