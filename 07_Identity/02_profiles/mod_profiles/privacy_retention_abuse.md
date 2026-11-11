# PS-056-07 — Privacy, retention and abuse: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-07.R01** The block list is P3 and never leaves the vault, never appears in statements, logs, relay requests or events below P3, and the blocked person receives no notification.
- **PS-056-07.R02** Public profile fields are exactly what the user marked public; a published profile and copies other vaults fetched cannot be recalled, only superseded or tombstoned, and the UI says so before first publication.
- **PS-056-07.R03** Region never exceeds L2 and is off by default.
- **PS-056-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (sections identity.profiles and identity.blocks), DeletionPort (tombstone the own published profile, delete profiles and blocks) and RetentionPurgePort, registers field classes with F10.S02.M02, calls privacy.consent.check(federation_publish, relayId) before every public relay publication, and treats privacy.deletion.completed only as final cleanup.

## Specification

**Data classification**
- Profile: P3 record with field classes - public fields P0 once published; contacts fields P2 end-to-end encrypted to participants; private fields stay P3 in the vault.
- BlockEntry: P3, device only; note is a private free text.

**Retention**
- Own profile and blocks until the user deletes them or vault erase (RET-STANDARD); removed blocks purged after 30 days; received profiles evicted after 180 days unviewed; tombstones kept 180 days (FED-4).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Blocked person learns of the block | statements from the blocked DID are dropped silently, no error identifies the block, the outbox of the sender shows at most transport_acknowledged and never peer_accepted; honest limit - repeated failure of acknowledgement can hint at it |
| T02 | Bio or avatar used for phishing or doxxing | plain text only, links not auto-linked, avatar re-encoded without metadata, report goes to the relay's hosting policy and local hide is available |
| T03 | Fake profile impersonating a known contact | profile signature by an active device key binds content to the DID, DID fingerprint always shown next to the pseudonym, confusable warning from F07.S01.M01 |
| T04 | Region leak through visibility mistakes | region defaults to private, preview of 'what a stranger sees', statement composer drops private fields, assertPublicCell and a contract test for L2 maximum |
| T05 | Mass profile spam from throwaway DIDs | vault intake limit of 50 profiles per hour per transport source, unknown DIDs shown as strangers, relay quotas apply |
| T06 | Relay deletes or hides a user's profile in other people's vaults | relay hosting actions affect only the relay copy, and relay-signed tombstones only drop that relay from provenance |
| T07 | Private field values leak through the record class | the record is P3 with per-field classes; logs, events below P3 and relay payloads carry only public fields |

**Abuse controls**
- Intake limits - 50 received profiles per hour per source, 32 KiB per statement, quarantine beyond.
- Block cap 1 000; block and unblock actions limited to 60 per hour to avoid accidental loops; limits run through the bus RateLimitPort (F12.S03.M03, N18).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T10 | abuse | PS-056-07.R01, PS-056-07.R03, PS-056-09.R02 | inspect statements, relay requests, logs and events for blocks, private fields and region precision; 51 profiles per hour from one source | none present; region at most 5 characters and private by default; excess quarantined |
| TEST-PS-056-09.T19 | abuse | PS-056-01.R01, PS-056-07.R04 | contacts and private field values with their F10 classes; scan logs, events below P3 and relay payloads | no private-visibility field anywhere; contacts fields only inside end-to-end encrypted statements |
| TEST-PS-056-09.T20 | integration | PS-056-07.R04 | publish to R1 and R2 where only R1 has federation_publish consent; publish with no consented relay; F10 export, deletion and retention sweep | R1 queued and R2 skipped and shown; PRECONDITION_FAILED; sections exported; deletion tombstones the own profile |
| TEST-PS-056-09.T21 | e2e | PS-056-07.R02, PS-056-09.R04 | UI copy check before first publication and on unpublish | no-recall notice shown before the first publication; unpublish explains that fetched copies cannot be recalled |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F06.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
