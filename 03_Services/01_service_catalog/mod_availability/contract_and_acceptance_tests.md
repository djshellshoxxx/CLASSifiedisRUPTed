# PS-028-09 — Contract and acceptance tests: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-028-09.R02** DST behaviour is covered by property tests over every zone in the bundled database for the years 2026 to 2028.
- **PS-028-09.R03** Statement and event payloads are checked against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Calendar in Europe/Berlin Mon-Fri 09:00-17:00 slot 60 min; America/New_York calendar; Pacific/Auckland calendar; fixed clock 2026-11-04T10:00:00Z; tz database 2026b; stub privacy.consent.check and isBlockedEither ports.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T01 | unit | PS-028-01.R01 | expand Monday rule on 2027-03-28 and 2026-10-25 in Europe/Berlin | nonexistent 02:30 skipped; repeated 02:30 produces one slot at UTC+2; slots stored as UTC |
| TEST-PS-028-09.T02 | unit | PS-028-02.R01, PS-028-02.R02, PS-028-02.R03 | each rule V01–V13 violated | documented code returned and nothing stored |
| TEST-PS-028-09.T03 | property | PS-028-01.R01, PS-028-02.R02, PS-028-09.R02 | random rules in every zone for 2026-2028 | derived slots are unique, ordered, non-overlapping, and no slot falls in a DST gap |
| TEST-PS-028-09.T04 | unit | PS-028-01.R02, PS-028-03.R01 | hold, extend, reconfirm, commit, release, expire transitions plus undeclared ones and a second extend | only declared transitions succeed; others and the second extend return CONFLICT_STATE |
| TEST-PS-028-09.T05 | integration | PS-028-03.R03, PS-028-06.R03 | crash injected between commit and booking confirmation | both or neither persisted |
| TEST-PS-028-09.T06 | integration | PS-028-02.R03, PS-028-06.R02 | two tabs hold overlapping slots simultaneously | exactly one succeeds, other SERVICES_SLOT_UNAVAILABLE |
| TEST-PS-028-09.T07 | contract | PS-028-04.R01, PS-028-04.R02, PS-028-09.R01, PS-028-09.R03 | each command and the summary statement | outputs, events and statement validate against registry schemas; signature verifies |
| TEST-PS-028-09.T08 | integration | PS-028-04.R03 | quote declined, quote expired, block added and booking cancelled events delivered twice | holds released once with the documented reason; duplicates skipped |
| TEST-PS-028-09.T09 | abuse | PS-028-05.R01, PS-028-05.R02, PS-028-05.R03 | foreign principal command; summary whose providerId differs from the signing key; summary naming an offering of another provider; relay refusal | FORBIDDEN; both summaries quarantined; sync state refused without local change |
| TEST-PS-028-09.T10 | abuse | PS-028-07.R03 | one client requests 4 holds | 4th returns SERVICES_HOLD_LIMIT |
| TEST-PS-028-09.T11 | integration | PS-028-06.R01, PS-028-07.R02 | replay hold command; advance clock 15 days after a summary | same holdId; expired summary dropped by the receiver |
| TEST-PS-028-09.T12 | load | PS-028-08.R01, PS-028-08.R02, PS-028-08.R03 | 5 000 holds, mobile throttled profile | generation p95 ≤ 50 ms, hold p95 ≤ 100 ms, no network requests |
| TEST-PS-028-09.T13 | integration | PS-028-10.R01, PS-028-10.R02, PS-028-10.R03 | export, import into fresh vault, change tz database version | calendars round-trip; moved holds flagged needsReconfirmation |
| TEST-PS-028-09.T14 | a11y | PS-028-01.R01 | slot grid and DST banner with screen reader and keyboard | all slots reachable, banner announced, axe zero serious issues |
| TEST-PS-028-09.T15 | integration | PS-028-03.R02 | move the clock past a hold's expiresAt and request an overlapping hold before the sweep runs | new hold succeeds; the old hold reads as expired |
| TEST-PS-028-09.T16 | integration | PS-028-01.R03, PS-028-07.R01 | run every command with held and committed slots present and inspect the sync outbox | only publish_summary produces an outbound envelope; it carries only the allowlisted fields, no held or committed interval and no client identity |
| TEST-PS-028-09.T17 | integration | PS-028-01.R02, PS-028-07.R04 | retention sweep 30 days after release and expiry | released and expired holds purged through RetentionPurgePort; counts only in privacy.retention.purged |
| TEST-PS-028-09.T18 | integration | PS-028-03.R04, PS-028-03.R03 | rule change removes the interval of a held hold, then commit, reconfirm with keep, commit | first commit SERVICES_SLOT_UNAVAILABLE; after reconfirm the commit succeeds and the interval stays committed |
| TEST-PS-028-09.T19 | contract | PS-028-04.R03 | deliver services.booking.cancelled {bookingId, quoteId, slotHoldId} for a held hold and for a committed hold | both holds released with reason booking_cancelled |
| TEST-PS-028-09.T20 | integration | PS-028-03.R01, PS-028-03.R02 | quote hold with ttl 72 h 5 min, acceptance at 71 h extends it, commit at 80 h; second quote whose hold expired is re-held when free and refused when taken | commit succeeds; re-hold has reholdOf; taken interval returns SERVICES_SLOT_UNAVAILABLE |
| TEST-PS-028-09.T21 | abuse | PS-028-07.R04 | publish_summary to a relay without federation_publish consent; privacy.deletion.completed for a holder; export | SERVICES_PUBLISH_CONSENT_MISSING and nothing signed; holderId replaced by the pseudonym; export section services.calendars present |
| TEST-PS-028-09.T22 | integration | PS-028-05.R02 | receiver gets summaries with seq 5 then seq 4, and one signed by a revoked key | seq 5 kept, seq 4 ignored; revoked-key summary not shown as valid; re-signed summary accepted |

## Acceptance criteria

- All tests T01–T22 pass in CI.
- Property test finds no overlapping committed intervals and no slot inside a DST gap for any zone in 2026-2028.
- Hold and commit work fully offline, a hold needing reconfirmation never commits, and the UI never shows peer_accepted without a signed acknowledgement.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
