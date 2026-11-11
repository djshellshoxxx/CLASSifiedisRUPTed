# PS-056-02 — Validation rules: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-02.R01** Profile input is validated strictly with exact limits, and avatars are re-encoded, stripped of metadata and size-checked on the device.
- **PS-056-02.R02** Visibility and region rules guarantee that no private field and no location finer than L2 enter a statement, and the region passes F06.S02.M01 assertPublicCell (N8).
- **PS-056-02.R03** Block input validates DIDs and the cap, and intake of received profiles verifies signatures before storage.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | bio is at most 500 code points of plain text after NFC and control character removal | VALIDATION_FAILED |
| V02 | avatar is WebP, exactly 128 by 128 px, at most 24 576 bytes, with EXIF, XMP and GPS metadata stripped by F10.S02.M03 before it is stored as a MediaBlob (F15.S02.M03, N9) | IDENTITY_AVATAR_INVALID |
| V03 | F06.S02.M01 assertPublicCell(regionCell) passes and regionCell equals the last publicCell received via discovery.location.updated | IDENTITY_REGION_INVALID |
| V04 | languages has at most 5 valid BCP 47 tags | VALIDATION_FAILED |
| V05 | blockedDid is a valid did:key, differs from the principal, and fewer than 1 000 active blocks exist | IDENTITY_BLOCK_LIMIT |
| V06 | received profile statement is at most 32 KiB, its signature verifies with a device key that the DID's document listed as active at this vault's first-seen time (F07.S02.M01 key_status), and seq is greater than the stored seq | IDENTITY_PROFILE_INVALID |
| V07 | expectedRevision equals the current revision on profile update | CONFLICT_REVISION |
| V08 | unpublish targets an own profile with publishState published | CONFLICT_STATE |
| V09 | privacy.consent.check(federation_publish, relayId) is granted for each target relay before a public statement is queued; relays without consent are skipped and a publish with no remaining relay is refused; tombstones are always sent | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T02 | unit | PS-056-02.R01, PS-056-01.R03 | upload 3 MB JPEG with GPS EXIF and an oversized WebP | re-encoded WebP 128 by 128 under 24 KiB, stripped by F10.S02.M03 and stored as a MediaBlob, or IDENTITY_AVATAR_INVALID |
| TEST-PS-056-09.T03 | unit | PS-056-02.R01, PS-056-02.R02 | bio 501 code points, 6 languages, region cell with 6 characters, region differing from the last publicCell, stale expectedRevision | VALIDATION_FAILED, IDENTITY_REGION_INVALID (assertPublicCell called) or CONFLICT_REVISION each time |
| TEST-PS-056-09.T18 | abuse | PS-056-05.R01, PS-056-02.R03 | a profile signed by P2 first seen after P2's revocation, and one signed by P2 first seen before it | the first rejected with IDENTITY_PROFILE_INVALID; the second kept |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
