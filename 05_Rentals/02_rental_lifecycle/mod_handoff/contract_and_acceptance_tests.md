# PS-042-09 — Contract and acceptance tests: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-042-09.R02** Signature and cid binding is covered by unit and property tests including revision clearing.
- **PS-042-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped, reordered and contradictory statements.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with confirmed reservation B starting 2026-12-05T09:00:00Z and a 3-item checklist template; hostile in-memory relay with expiring blobs; photo fixtures with and without EXIF, XMP and GPS metadata; fixed clock 2026-12-05T08:30:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip metadata through F10.S02.M03 before encryption, sign it | MediaBlob ids computed over the stripped bytes; no metadata in stored or sent bytes; cid stable |
| TEST-PS-042-09.T02 | unit | PS-042-02.R02, PS-042-02.R03 | each rule V01–V11 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-042-09.T03 | property | PS-042-03.R01, PS-042-09.R02 | random statement and event sequences including new revisions after attestations and forked-device reports | only declared transitions succeed; terminal states never change; any new revision clears attestations on older cids; frozen leaves only through a new owner revision, cancellation or expiry |
| TEST-PS-042-09.T04 | integration | PS-042-03.R02, PS-042-01.R03 | attest revision 2 after revision 3 exists; request changes then re-attest | RENTALS_REPORT_STALE; new revision clears attestations; attested only on the exact cid |
| TEST-PS-042-09.T05 | integration | PS-042-03.R03, PS-042-04.R03 | both parties sign offline at the meeting and sync later | attested when both signatures held; reservation endsAt unchanged; event emitted once per vault |
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T07 | contract | PS-042-04.R01, PS-042-04.R03, PS-042-04.R04 | each command, statement and event | payloads and signatures validate against registry schemas and the registered signer roles |
| TEST-PS-042-09.T08 | abuse | PS-042-05.R01, PS-042-05.R02, PS-042-05.R03, PS-042-07.R02 | inbound attestation by a non-party key; local attest by the author of the report; photo with GPS EXIF sent by a modified client | the attestation is quarantined with RENTALS_STATEMENT_INVALID; the local attest returns FORBIDDEN; the receiving vault quarantines the photo with RENTALS_PHOTO_METADATA and the relay payload is ciphertext only; no state change |
| TEST-PS-042-09.T09 | integration | PS-042-06.R02, PS-042-03.R05 | renter's forked devices sign two reports for revision 1; owner and renter submit revision 1 concurrently; photo strip fails | handoff frozen until a new owner revision; the concurrent case keeps the owner's report and turns the renter's into a changes request; report not signed on strip failure |
| TEST-PS-042-09.T10 | abuse | PS-042-07.R01, PS-042-07.R03 | inspect logs, notifications, relay payloads; 101 inbound statements in a day | no item text or photos outside encrypted envelopes; 101st dropped and counted |
| TEST-PS-042-09.T11 | integration | PS-042-03.R01, PS-042-03.R04 | reservation cancelled mid-report; nobody signs a report by +96 h; owner signs a report that is never attested by +96 h; the renter requests changes to a signed owner report and nobody signs again by +96 h | handoff cancelled with drafts kept; expired with no_report and reservation cancelled no_handoff; expired with unattested and no cancellation requested in the last two cases |
| TEST-PS-042-09.T12 | load | PS-042-08.R01, PS-042-08.R02, PS-042-08.R03 | 2 000 handoffs; 20-photo report; throttled mobile profile | sign/verify p95 ≤ 120 ms, 5 MiB photo ≤ 800 ms in worker, no telemetry request |
| TEST-PS-042-09.T13 | unit | PS-042-09.R01 | traceability tool run | every PS-042 requirement maps to a passing test |
| TEST-PS-042-09.T14 | integration | PS-042-10.R01, PS-042-10.R02, PS-042-10.R03 | export, import into fresh vault, restore | reports, attestations and photo references round-trip; missing photo copies shown as missing |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-04.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |
| TEST-PS-042-09.T16 | unit | PS-042-02.R01 | inbound attestation with a bad signature naming a stale cid; inbound attestation signed by the author with a createdAt outside the window | RENTALS_STATEMENT_INVALID for both; the staleness and window failures are never reported |
| TEST-PS-042-09.T17 | integration | PS-042-02.R04, PS-042-03.R04 | two vaults - attestation signed at +23 h delivered at +25 h; both parties sign at +1 h and the signatures arrive at +30 h; a statement signed at +20 h delivered at +100 h | first two attested in both vaults with no expiry or cancellation in either; the third refused with RENTALS_HANDOFF_WINDOW |
| TEST-PS-042-09.T18 | integration | PS-042-07.R04, PS-042-01.R02 | relay blob of one photo expired before the renter fetched it; author deletes the thread message after the renter stored the other photos | attest refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify against their MediaBlob ids after the deletion |
| TEST-PS-042-09.T19 | chaos | PS-042-06.R03 | crash injected after the state change, after the event and before the outbox write during attest | after restart no partial state - state, event and outbox entry all present or all absent - and replay converges |
| TEST-PS-042-09.T20 | integration | PS-042-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym; signatures and photo hashes verify; section rentals.handoffs exported; purge removes terminal records and photo copies |
| TEST-PS-042-09.T21 | abuse | PS-042-07.R06 | owner blocks the renter after confirmation, then the renter's attestation arrives | verified and stored, handoff attested, notification suppressed |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- A handoff is attested only when both signatures cover the same report cid with every photo held and verified, and any edit clears attestations.
- No stored or displayed photo contains EXIF, XMP or GPS metadata, no relay check is claimed, and the UI states that the attestation is not proof of condition.

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
