# PS-056-09 — Contract and acceptance tests: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-056-09.R02** Privacy tests prove that private fields and blocks never appear in statements, logs or events below P3.
- **PS-056-09.R03** Block enforcement is tested end to end across a consumer module fake.
- **PS-056-09.R04** Accessibility and UI copy tests check the profile, blocked people and other-profile screens, including the no-recall notice before first publication.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with DID and device keys P1 (active) and P2 (revoked at 09:00), strangers S1, S2 (S2 blocked), contact C, relays R1 (consented) and R2 (no consent), avatar fixtures (3 MB JPEG with GPS EXIF, valid WebP), F06.S02.M01 and F10.S02.M03 stubs, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T01 | unit | PS-056-01.R01, PS-056-01.R03 | update bio and visibility then compose the public statement | statement contains only public fields, signed by P1; private fields absent; size under 32 KiB; field classes registered |
| TEST-PS-056-09.T02 | unit | PS-056-02.R01, PS-056-01.R03 | upload 3 MB JPEG with GPS EXIF and an oversized WebP | re-encoded WebP 128 by 128 under 24 KiB, stripped by F10.S02.M03 and stored as a MediaBlob, or IDENTITY_AVATAR_INVALID |
| TEST-PS-056-09.T03 | unit | PS-056-02.R01, PS-056-02.R02 | bio 501 code points, 6 languages, region cell with 6 characters, region differing from the last publicCell, stale expectedRevision | VALIDATION_FAILED, IDENTITY_REGION_INVALID (assertPublicCell called) or CONFLICT_REVISION each time |
| TEST-PS-056-09.T04 | property | PS-056-03.R01, PS-056-03.R02, PS-056-03.R03 | random sequences of hide, unhide, tombstone, unpublish, block, unblock and relay hosting events | only declared transitions succeed; deleted and removed are final; relay hosting events never change a vault record |
| TEST-PS-056-09.T05 | integration | PS-056-01.R02, PS-056-04.R02 | block S2 then deliver a profile, an offer card and a message from S2 | all dropped silently; S2 gets no error; isBlockedEither is true both ways |
| TEST-PS-056-09.T06 | contract | PS-056-04.R01, PS-056-04.R03 | every command, query and event run | outputs, statements and payloads validate against registry schemas; signatures verify; a stranger view has only public fields |
| TEST-PS-056-09.T07 | integration | PS-056-04.R02, PS-056-09.R03 | consumer fakes subscribe to identity.block.added | open offers, drafts, shares and outbox items to the blocked DID are cancelled with reason blocked |
| TEST-PS-056-09.T08 | abuse | PS-056-05.R01, PS-056-05.R02, PS-056-05.R03 | stranger requests contacts fields; forged profile for a known DID; locked vault edits; relay asks for the block list | only public fields served; signature fails; FORBIDDEN; the relay has no block data |
| TEST-PS-056-09.T09 | chaos | PS-056-06.R01, PS-056-06.R02, PS-056-06.R03 | replay of the same key and the same statement; offline publish; avatar encoder failure | one result; outbox states shown honestly; blocking works offline; whole update rejected on failure |
| TEST-PS-056-09.T10 | abuse | PS-056-07.R01, PS-056-07.R03, PS-056-09.R02 | inspect statements, relay requests, logs and events for blocks, private fields and region precision; 51 profiles per hour from one source | none present; region at most 5 characters and private by default; excess quarantined |
| TEST-PS-056-09.T11 | load | PS-056-08.R01, PS-056-08.R02, PS-056-08.R03 | 10 000 block lookups and filterBlocked(500) on emulated Moto G; profile view on the 4G profile | p95 <= 1 ms and <= 5 ms; LCP <= 2.5 s; counters carry no DIDs |
| TEST-PS-056-09.T12 | a11y | PS-056-09.R04 | edit profile, blocked people and other-profile screens with axe-core | zero serious or critical issues; counter and dialogs announced |
| TEST-PS-056-09.T13 | unit | PS-056-09.R01 | traceability run over PS-056 | every requirement maps to a passing test |
| TEST-PS-056-09.T14 | integration | PS-056-10.R01, PS-056-10.R02, PS-056-10.R03 | export, import in a fresh vault, vault erase, and a statement with an unknown ext field | profile and blocks round-trip; received profiles re-verified; erase removes all; older reader ignores the ext field |
| TEST-PS-056-09.T15 | integration | PS-056-04.R01 | unpublish a profile published to R1 while R1 is offline, then online | tombstone signed by P1 queued with per-relay sync state; identity.profile.updated with changedFields [withdrawn]; after delivery a viewer vault deletes the profile |
| TEST-PS-056-09.T16 | abuse | PS-056-04.R04 | a tombstone for P's profile signed by origin relay R1, then one signed by P1 | after the relay tombstone the profile stays active with R1 removed from provenance; the author tombstone deletes it |
| TEST-PS-056-09.T17 | integration | PS-056-04.R05, PS-056-03.R01 | moderation.action.applied and moderation.action.reverted delivered to a vault and to the relay runtime | the relay stops and then resumes serving its copy; the vault Profile is unchanged except an optional notServedBy provenance entry |
| TEST-PS-056-09.T18 | abuse | PS-056-05.R01, PS-056-02.R03 | a profile signed by P2 with a backdated createdAt arriving after the revoking document; P2's revocation learned later for a profile first seen after its effective time and one first seen before it | the first rejected with IDENTITY_PROFILE_INVALID; on learning, the later-seen one quarantined and the earlier-seen one kept with a revoked-signer marker |
| TEST-PS-056-09.T19 | abuse | PS-056-01.R01, PS-056-07.R04 | contacts and private field values with their F10 classes; scan logs, events below P3 and relay payloads | no private-visibility field anywhere; contacts fields only inside end-to-end encrypted statements |
| TEST-PS-056-09.T20 | integration | PS-056-07.R04 | publish to R1 and R2 where only R1 has federation_publish consent; publish with no consented relay; F10 export, deletion and retention sweep | R1 queued and R2 skipped and shown; PRECONDITION_FAILED; sections exported; deletion tombstones the own profile |
| TEST-PS-056-09.T21 | e2e | PS-056-07.R02, PS-056-09.R04 | UI copy check before first publication and on unpublish | no-recall notice shown before the first publication; unpublish explains that fetched copies cannot be recalled |
| TEST-PS-056-09.T22 | integration | PS-056-04.R06 | F08.S01.M01 stub calls MailboxHintPort.set after register on R1, then after rotate with a new ID, with the profile published to R1 and mailboxes visibility public; then with mailboxes private | the own profile holds the ID, then the replacement; a new version with seq plus 1 carrying only the replacement is published to R1 after the consent check; identity.profile.updated lists mailboxes; private mailboxes never enter a statement |
| TEST-PS-056-09.T23 | contract | PS-056-04.R01 | publish and unpublish with a StatementPublisherPort spy | publish calls StatementPublisherPort.publish and unpublish calls issueTombstone; seq and prev come from the port; no other signing path is used |

## Acceptance criteria

- All tests T01-T23 pass in CI.
- The block list never appears in any statement, relay payload, log or event class below P3 (privacy suite).
- A blocked DID's statements are dropped on intake in every module that consumes the block port.
- No relay action or relay-signed tombstone changes or deletes a profile record inside a vault.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F11.S01.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
