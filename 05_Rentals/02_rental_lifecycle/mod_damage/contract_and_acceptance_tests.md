# PS-041-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-09. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines the contract and acceptance tests that show the damage module meets PS-041-01 through PS-041-08. Each test has an ID, a scenario and an objective pass or fail criterion. Tests are specified here; none has been run.

Exclusions: test execution, CI wiring and performance tooling choices (later phases).

## Requirements
- **PS-041-09.R01** Test coverage. Every requirement ID in PS-041-01 through PS-041-08 has at least one test ID in this file or in the file that owns it.
- **PS-041-09.R02** Case coverage. Tests cover normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- **PS-041-09.R03** Accessibility and performance. Tests include the client accessibility checks and the latency checks in observability_performance.md.

## Fixtures
- All fixtures are synthetic. Participant IDs are generated ULIDs. Names, addresses and contact details are never used.
- Fixture rental: one returned rental in USD, one item, one return recorded 1 day before the test clock.
- Fixture clock: a controllable server clock. Deadline tests advance it, never wait for wall time.
- Evidence fixtures: a 1 KiB JPEG with GPS EXIF, a 16 MiB PNG, a PDF, and a file with a wrong digest.

## Test index
Test ID format: `TEST-PS-041-<requirement>-Tnn`. Pass means every stated check holds. Fail means any stated check does not hold.

### Domain schema (PS-041-01)
- **TEST-PS-041-01-T01** Create a claim with all required fields. Pass: row stored with defaults (state OPEN, revision 1, schema_version "1.0"). Fail: any default differs or a required field is accepted as NULL.
- **TEST-PS-041-01-T02** Insert a second non-terminal claim for the same item and return. Pass: the database rejects it. Fail: a second row is stored.
- **TEST-PS-041-01-T03** Store an amount of 100000001. Pass: rejected at the boundary. Fail: stored.
- **TEST-PS-041-01-T04** Read a claim with a non-ASCII description in decomposed form. Pass: returned in NFC. Fail: returned unnormalized.

### Validation (PS-041-02)
- **TEST-PS-041-02-T01** Send each V01–V24 rule with one failing value. Pass: the specified code is returned and no row changes. Fail: a different code or any write.
- **TEST-PS-041-02-T02** Check pipeline order with a request that fails steps 2 and 7. Pass: the step 2 code is returned. Fail: the step 7 code is returned.
- **TEST-PS-041-02-T03** Send a description with a right-to-left override character. Pass: DAMAGE_TEXT_INVALID. Fail: stored.
- **TEST-PS-041-02-T04** Check that every code in the catalog appears in the test suite. Pass: count matches catalog size. Fail: a catalog code is untested.

### State machine (PS-041-03)
- **TEST-PS-041-03-T01** Walk the normal accept path OPEN to AGREED. Pass: state, revision and events match the table. Fail: any mismatch.
- **TEST-PS-041-03-T02** Walk the counter path OPEN to COUNTER_PROPOSED to AGREED with the counter amount. Pass: agreed amount equals counter. Fail: equals claimed amount.
- **TEST-PS-041-03-T03** Advance the clock past the OPEN deadline without a response. Pass: state EXPIRED, resolution_kind expired, no agreed amount. Fail: state AGREED or any agreed amount.
- **TEST-PS-041-03-T04** Set a hold, advance the clock, release the hold. Pass: timer did not fire during hold and the remaining time is restored. Fail: expiry during hold or remaining time not restored.
- **TEST-PS-041-03-T05** Submit a command against a terminal claim. Pass: DAMAGE_CLAIM_CLOSED. Fail: any write.
- **TEST-PS-041-03-T06** Two attestations with different amounts, then a matching pair. Pass: first mismatch keeps state and returns DAMAGE_EXTERNAL_ATTESTATION_MISMATCH; matching pair closes as CLOSED_EXTERNAL. Fail: closes on mismatch.

### Commands, queries and events (PS-041-04)
- **TEST-PS-041-04-T01** Send open_claim twice with the same key and payload. Pass: second response is identical with `replayed: true` and one row exists. Fail: two rows or a different response.
- **TEST-PS-041-04-T02** Send the same key with a different payload. Pass: DAMAGE_IDEMPOTENCY_KEY_REUSED. Fail: any write.
- **TEST-PS-041-04-T03** Send a respond command with an old `expected_revision`. Pass: DAMAGE_STALE_REVISION with `current_revision`. Fail: any write.
- **TEST-PS-041-04-T04** Check each event payload for free-text fields. Pass: none present. Fail: any description, comment, caption or note text.
- **TEST-PS-041-04-T05** Check that sequence numbers per claim are gap-free after 20 commands. Pass: sequence 1..N with no gap. Fail: gap or duplicate.

### Authorization (PS-041-05)
- **TEST-PS-041-05-T01** Non-party reads an existing claim. Pass: DAMAGE_CLAIM_NOT_FOUND with the same body as a missing claim. Fail: any difference that reveals existence.
- **TEST-PS-041-05-T02** Moderator who is a party attempts a resolve. Pass: DAMAGE_NOT_PARTY or denial by separation check. Fail: resolve succeeds.
- **TEST-PS-041-05-T03** Blocked participant attempts respond. Pass: DAMAGE_PARTICIPANT_BLOCKED. Fail: write succeeds.
- **TEST-PS-041-05-T04** Renter attempts counter.accept. Pass: DAMAGE_NOT_PARTY. Fail: state changes.

### Failure, recovery and idempotency (PS-041-06)
- **TEST-PS-041-06-T01** Inject a timeout after commit, then replay. Pass: single transition and `replayed: true`. Fail: two transitions.
- **TEST-PS-041-06-T02** Two concurrent responds at the same revision. Pass: exactly one commits. Fail: both commit or neither commits without an error code.
- **TEST-PS-041-06-T03** Hold lock contention beyond 2 s. Pass: DAMAGE_CLAIM_BUSY and no partial write. Fail: partial write.
- **TEST-PS-041-06-T04** Upload with wrong digest. Pass: DAMAGE_EVIDENCE_HASH_MISMATCH and staged bytes removed. Fail: metadata row created.
- **TEST-PS-041-06-T05** Kill the expiry job mid-batch and rerun. Pass: each claim expires once. Fail: duplicate event or missed claim.
- **TEST-PS-041-06-T06** Queue an offline accept, advance the revision on the server, then reconnect. Pass: DAMAGE_STALE_REVISION and the queue stops for that claim. Fail: accept applied.

### Privacy, retention and abuse (PS-041-07)
- **TEST-PS-041-07-T01** Upload a JPEG with GPS EXIF. Pass: stored copy has no GPS fields. Fail: any GPS field remains.
- **TEST-PS-041-07-T02** Create four claims against one renter within 30 days. Pass: F12 flag raised; no claim blocked. Fail: a claim is blocked or no flag raised.
- **TEST-PS-041-07-T03** Exceed the open_claim rate limit. Pass: DAMAGE_RATE_LIMITED with `Retry-After` on the sixth attempt. Fail: sixth attempt succeeds.
- **TEST-PS-041-07-T04** Run the purge job after retention boundary. Pass: free text and media removed, tombstone event written, sequence preserved. Fail: sequence gap or text remains.

### Observability (PS-041-08)
- **TEST-PS-041-08-T01** Scan logs from the test run for forbidden fields. Pass: none found. Fail: any forbidden field.
- **TEST-PS-041-08-T02** Measure p95 for open_claim and respond at the test load. Pass: at or below 400 ms. Fail: above 400 ms.
- **TEST-PS-041-08-T03** Render claim detail at 360 px width. Pass: no horizontal scroll, touch targets at least 44 px, text contrast meets WCAG 2.2 AA. Fail: any failure.

### Consumer contracts and export (PS-041-09 and PS-041-10)
- **TEST-PS-041-09-T01** Consumer contract for F13, F12 and F09 event subscribers. Pass: each consumer parses every event in its consumer map with schema "1.0". Fail: parse error.
- **TEST-PS-041-09-T02** Replay the full event log into a fresh projection. Pass: projection equals the live claim row. Fail: any difference.
- **TEST-PS-041-09-T03** Export a party's data and check contents. Pass: only that party's claims are present, moderator notes excluded. Fail: any other party's data present.

## Load test
- 100 concurrent respond commands on 100 distinct claims. Pass: all succeed with p95 at or below 400 ms. Fail: any 5xx or p95 above the budget.

## Open decisions
- Test tooling and CI wiring are not decided here.
- Assumptions referenced by these tests: A-damage-01 through A-damage-21 (see each owning file).
- A-damage-07 pipeline order is tested in TEST-PS-041-02-T02; confirm in Prompt 3 review.
