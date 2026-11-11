# PS-059-09 — Contract and acceptance tests: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-059-09.R02** Contract tests check command input and output and event payloads against the schema registry.
- **PS-059-09.R03** The metadata stripping pipeline is covered by fixture images carrying every known metadata container.
- **PS-059-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults A and B, in-memory relay R with MediaBlob store, active thread TH; fixture images jpeg-with-gps.jpg, png-with-text-chunks.png, webp-with-xmp.webp, images yielding 5 241 600 and 5 241 601 bytes of plaintext; a hostile relay double that reorders, truncates and drops chunks; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T01 | unit | PS-059-01.R01, PS-059-01.R03, PS-059-02.R01, PS-059-02.R02 | create slots for allowed types and sizes and for the boundaries 5 241 600 and 5 241 601 bytes of plaintext | allowed accepted; larger refused with COMMS_ATTACHMENT_TOO_LARGE; svg refused with TYPE_UNSUPPORTED |
| TEST-PS-059-09.T02 | unit | PS-059-07.R02, PS-059-09.R03 | run the F10.S02.M03 client pipeline on the three metadata fixtures | output has zero EXIF, GPS, XMP, IPTC, thumbnail and text chunks and verifyImageClean passes |
| TEST-PS-059-09.T03 | unit | PS-059-02.R03, PS-059-02.R02 | finalize with wrong hash and with truncated blob | COMMS_ATTACHMENT_HASH_MISMATCH and blob not downloadable |
| TEST-PS-059-09.T04 | property | PS-059-03.R01, PS-059-03.R02, PS-059-03.R03 | random sequences of chunk, finalize, delete, sweep | only declared transitions succeed; deleted and expired never change |
| TEST-PS-059-09.T05 | contract | PS-059-04.R01, PS-059-04.R02, PS-059-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-059-09.T06 | integration | PS-059-04.R03, PS-059-03.R03 | author deletes the message in prepared and in peer_accepted state; delivery abandoned after 7 days; retainUntil passes | signed relay delete issued or sweep runs, blob erased from the live store in each case and downloads return NOT_FOUND |
| TEST-PS-059-09.T07 | abuse | PS-059-05.R01, PS-059-05.R02, PS-059-05.R03 | upload without relay token; download with wrong token; delete signed by another device key | UNAUTHENTICATED, NOT_FOUND or FORBIDDEN |
| TEST-PS-059-09.T08 | integration | PS-059-06.R01, PS-059-06.R02 | upload 10 chunks, kill connection after 3, resume, repeat chunk 2 with different bytes | upload completes; conflicting repeat refused |
| TEST-PS-059-09.T09 | chaos | PS-059-06.R03 | crash between blob rename and commit; lost finalize response | reconciliation sweep removes orphan blob and expires row; repeated finalize replays the stored response |
| TEST-PS-059-09.T10 | abuse | PS-059-01.R02, PS-059-07.R03, PS-059-02.R03 | after message delete inspect the relay live store and the relay backup set; a recipient who saved key and blob opens it; 61st slot in a day | blob absent from live store and backup set; the saved copy still opens as documented; RATE_LIMITED |
| TEST-PS-059-09.T11 | abuse | PS-059-07.R01 | inspect database and storage dump | only ciphertext, sizes, declared type and thread label hashes present; no filenames, threadIds or plaintext metadata |
| TEST-PS-059-09.T12 | load | PS-059-08.R01, PS-059-08.R02, PS-059-08.R03 | 20 concurrent 5 MiB uploads over simulated 2 Mbit/s links | each completes within 20 s, p95 budgets met, sweep lag recovers |
| TEST-PS-059-09.T13 | unit | PS-059-09.R01 | traceability tool run | every PS-059 requirement maps to a passing test |
| TEST-PS-059-09.T14 | integration | PS-059-10.R01, PS-059-10.R02, PS-059-10.R03 | export, re-import and restore from backup | attachment rows and ciphertext round trip identical; import with missing blob marks row expired |
| TEST-PS-059-09.T15 | a11y | PS-059-09.R04 | attach, delete confirmation and view flow with screen reader | progress announced, alt text field reachable, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-059-09.T16 | abuse | PS-059-01.R04, PS-059-01.R05, PS-059-02.R04 | hostile relay serves chunks reordered, truncated, with one chunk dropped and with the last chunk flag moved | recipient rejects with COMMS_ATTACHMENT_HASH_MISMATCH before decrypting; no plaintext produced |
| TEST-PS-059-09.T17 | integration | PS-059-01.R01 | finalize an upload and inspect storage | ciphertext stored as MediaBlob blob:sha256-… with encrypted true; the attachment row holds only slot, chunk and size metadata |
| TEST-PS-059-09.T18 | integration | PS-059-04.R04, PS-059-07.R04 | account deletion with three uploaded attachments | DeletionPort.execute sends three signed relay deletes before keys are destroyed; privacy.deletion.completed finds nothing to sign; export section comms.attachments present beforehand |
| TEST-PS-059-09.T19 | integration | PS-059-03.R04 | finalize, delete and expiry responses recorded | comms.attachment.uploaded and comms.attachment.deleted emitted in the uploader vault with threadId from the local record; the relay emitted nothing and holds only thread_label_hash |
| TEST-PS-059-09.T20 | unit | PS-059-07.R03 | render the delete confirmation and documentation page | text says removed from the relay's live store and that recipients who saved it and relay-kept backups may still hold a copy; it never says crypto-shredded |

## Acceptance criteria

- All tests T01 to T20 pass in CI.
- Fixture images with GPS, XMP and text metadata produce zero metadata after the device pipeline.
- After a message is deleted no ciphertext blob for its attachment exists in the relay's live MediaBlob store.

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
