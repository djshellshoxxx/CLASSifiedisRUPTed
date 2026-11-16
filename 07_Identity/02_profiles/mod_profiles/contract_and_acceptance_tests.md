# PS-056-09 — Contract and acceptance tests: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-056-09.R02** Privacy tests prove that private fields and blocks never appear in statements, logs or events below P3.
- **PS-056-09.R03** Block enforcement is tested end to end across a consumer module fake.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with DID, strangers S1, S2 (S2 blocked), contact C, avatar fixtures (3 MB JPEG with GPS EXIF, valid WebP), fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T01 | unit | PS-056-01.R01, PS-056-01.R03, PS-056-02.R01 | update bio and visibility then compose the public statement | statement contains only public fields; private fields absent; size under 32 KiB |
| TEST-PS-056-09.T02 | unit | PS-056-02.R02, PS-056-01.R03 | upload 3 MB JPEG with GPS EXIF and an oversized WebP | re-encoded WebP 128 by 128 under 24 KiB without metadata, or IDENTITY_AVATAR_INVALID |
| TEST-PS-056-09.T03 | unit | PS-056-02.R01, PS-056-02.R03 | bio 501 code points, 6 languages, region cell with 6 characters, stale expectedRevision | VALIDATION_FAILED, IDENTITY_REGION_INVALID or CONFLICT_REVISION each time |
| TEST-PS-056-09.T04 | property | PS-056-03.R01, PS-056-03.R02, PS-056-03.R03 | random sequences of hide, unhide, tombstone, block, unblock | only declared transitions succeed; deleted and removed are final |
| TEST-PS-056-09.T05 | integration | PS-056-01.R02, PS-056-04.R02 | block S2 then deliver a profile, an offer card and a message from S2 | all dropped silently; S2 gets no error; isBlockedEither is true both ways |
| TEST-PS-056-09.T06 | contract | PS-056-04.R01, PS-056-04.R03, PS-056-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; signatures verify |
| TEST-PS-056-09.T07 | integration | PS-056-04.R02, PS-056-06.R01 | consumer fakes subscribe to identity.block.added | open offers, drafts, shares and outbox items to the blocked DID are cancelled with reason blocked |
| TEST-PS-056-09.T08 | abuse | PS-056-05.R01, PS-056-05.R02, PS-056-05.R03 | stranger requests contacts fields; forged profile for a known DID; locked vault edits | only public fields served; signature fails; FORBIDDEN |
| TEST-PS-056-09.T09 | chaos | PS-056-06.R01, PS-056-06.R02, PS-056-06.R03 | replay of same key and same statement; offline publish; avatar encoder failure | one result; outbox states shown honestly; whole update rejected on failure |
| TEST-PS-056-09.T10 | abuse | PS-056-07.R01, PS-056-07.R02, PS-056-07.R03 | inspect statements, relay requests, logs and events for blocks and private fields; 51 profiles per hour from one source | none present; excess quarantined |
| TEST-PS-056-09.T11 | load | PS-056-08.R01, PS-056-08.R02, PS-056-08.R03 | 10 000 block lookups and filterBlocked(500) on emulated Moto G | p95 <= 1 ms and <= 5 ms |
| TEST-PS-056-09.T12 | a11y | PS-056-01.R01, PS-056-03.R01 | edit profile, blocked people and other-profile screens with axe-core | zero serious or critical issues; counter and dialogs announced |
| TEST-PS-056-09.T13 | unit | PS-056-09.R01, PS-056-09.R03 | traceability run over PS-056 | every requirement maps to a passing test |
| TEST-PS-056-09.T14 | integration | PS-056-10.R01, PS-056-10.R02, PS-056-10.R03 | export, import in a fresh vault, vault erase | profile and blocks round-trip; received profiles re-verified; erase removes all |

## Acceptance criteria

- All tests T01-T14 pass in CI.
- The block list never appears in any statement, relay payload, log or event class below P3 (privacy suite).
- A blocked DID's statements are dropped on intake in every module that consumes the block port.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
