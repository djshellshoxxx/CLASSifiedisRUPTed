# PS-065-07 — Privacy, retention and abuse: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-07.R01** Check-in never reads or records location; the signature only evidences that a key holder asserted arrival at a time they claim, not that they were at the place.
- **PS-065-07.R02** Trusted-contact links are user-initiated, expire in at most 24 hours and show only the owner's own check-in state, the place label and the window; they are encrypted with a key in the URL fragment, the viewer code comes from the app's integrity-pinned origin and not from the relay, so the hosting relay serves only ciphertext; anyone holding the full link can read it, which the UI states.
- **PS-065-07.R03** No-show reports are claims, labelled as the reporter's claim, capped by receivers, and carry no automatic penalties in this module; contradictions are announced to consumers.
- **PS-065-07.R04** Signed check-ins and no-show reports are RET-EVIDENCE (CTR-PRV-001, FLOW-08) kept beyond the thread purge; privacy duties (N6) - field classification per F10.S02.M02, ExportSectionPort, DeletionPort, RetentionPurgePort and pseudonymization on deletion - apply.

## Specification

**Data classification**
- MeetupCheckin and the signed check-in and report statements: P2 evidence, parties only; no coordinates.
- MeetupShare: P3 on the owner's device only; the relay holds an opaque share blob (share ID, ciphertext ≤ 2 048 bytes, expiry, creator key ID).

**Retention**
- Check-ins and signed check-in and no-show statements: RET-EVIDENCE (2 years after last related activity), independent of the thread purge; pseudonymized on principal deletion.
- Share blobs on the relay and share records: RET-EPHEMERAL (24 h) and erased at expiry or revocation.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | False no-show claim to harm reputation | claim label, reporter must have checked in, grace period, 24 hour limit, receivers keep 3 reports per meetup and reporter, the accused sees it and can contradict, comms.meetup.no_show_contradicted lets F12.S03.M02 reverse the weight |
| T02 | Check-in spoofed from home | signature proves assertion only and the UI says so; no location is collected, so no false precision is implied |
| T03 | Share link leaked to a stalker | link expires in 24 hours at most, shows no names or exact addresses, owner can revoke, UI warns that anyone with the link can read it |
| T04 | Relay operator reads share content, possibly by serving altered page code | snapshot encrypted with a key only in the URL fragment of an app-origin viewer URL; the viewer code is integrity-pinned on the app origin and the relay serves only ciphertext, so it cannot ship code that exfiltrates the key |
| T05 | Forged check-in by a third party | statements need an active party key signature, otherwise quarantined |
| T06 | Enumerating share IDs | UUIDv7 plus 256-bit key requirement for readable content, 30 requests per minute per IP, NOT_FOUND for unknown IDs |
| T07 | Counterparty's status disclosed to a non-participant without their knowledge | the snapshot holds only the owner's own check-in state, the place label and the window |
| T08 | Evidence lost when the thread is purged | check-in and report statements are RET-EVIDENCE and survive the thread purge |

**Abuse controls**
- Reports of abuse of no-show claims go to the relay operator or advisory feed with the signed statements attached (F12.S01.M01).
- Statements from DIDs the local principal blocked are dropped silently; the 5 reports per day limit in the reporter vault is a UX guard.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T09 | abuse | PS-065-01.R03, PS-065-01.R05, PS-065-07.R01, PS-065-07.R02, PS-065-09.R03 | capture all traffic and storage during check-ins of A and B and A's share creation | no location, no share key outside the fragment, the relay stores an opaque blob ≤ 2 048 bytes and no P3 field, and the decrypted snapshot holds A's own state but not B's |
| TEST-PS-065-09.T10 | abuse | PS-065-07.R03, PS-065-02.R04 | 6th no-show report in a day; report before grace period ends; 4th report from one reporter at the receiver | RATE_LIMITED as UX guard and COMMS_NO_SHOW_NOT_ALLOWED; receiver drops the 4th silently; reports labelled as claims in UI |
| TEST-PS-065-09.T15 | abuse | PS-065-04.R05, PS-065-07.R02 | open a share link; request the viewer path and any HTML or script from the relay origin | the viewer loads from the app origin with integrity-pinned assets; the relay serves no viewer code and answers only the ciphertext query |
| TEST-PS-065-09.T17 | integration | PS-065-01.R04, PS-065-07.R04 | archive and purge the thread 30 days after the meetup, then re-verify | check-in and report statements and the agreement consents remain and verify |
| TEST-PS-065-09.T18 | integration | PS-065-04.R06, PS-065-07.R04 | account deletion of B with an active share and kept check-ins | the share blob is deleted while keys exist; B's own kept evidence carries the pseudonym after privacy.deletion.completed; A's copy unchanged |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
