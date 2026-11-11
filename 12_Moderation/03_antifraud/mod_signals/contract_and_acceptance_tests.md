# PS-101-09 — Contract and acceptance tests: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-101-09.R02** Decay math and cap logic are covered by deterministic and property tests.
- **PS-101-09.R03** Consumer mapping is covered by contract tests per consumed event.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of principal P with counterparties B and C, relay X with moderator M1, events from catalog producers with their documented payloads, fixed clock 2026-11-04T10:00:00Z with an injectable clock, half-life 60 days example weight 10.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T02 | property | PS-101-01.R03, PS-101-03.R01, PS-101-03.R02 | random signal sets and times | decayed weight equals w × 0.5^(age/h); order of ingestion does not change totals; no row changes after insert |
| TEST-PS-101-09.T03 | unit | PS-101-02.R03 | compensation referencing a missing signal, another subject, or a compensation | NOT_FOUND |
| TEST-PS-101-09.T04 | contract | PS-101-04.R03, PS-101-06.R01, PS-101-09.R03 | each consumed event delivered twice with the producer's documented payload fixture | exactly one signal per source event with the documented kind, weight, half-life, subject field and sourceKey field |
| TEST-PS-101-09.T05 | contract | PS-101-04.R01, PS-101-04.R02, PS-101-09.R02 | command, queries and event | validate against registry schemas; signal.recorded emitted in the row transaction without sourceKey |
| TEST-PS-101-09.T06 | abuse | PS-101-05.R01, PS-101-05.R02, PS-101-05.R03 | other member queries signals; relay moderator without case; subject reads own categories | NOT_FOUND, FORBIDDEN, categories only |
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-01.R04 | 4th no_show signal from the same sourceKey about B in 30 days; 4th from a different sourceKey; manual weight above cap | first 4th ignored for scoring and counted in sourceCapped; second counts; MODERATION_SIGNAL_MANUAL_CAP |
| TEST-PS-101-09.T08 | integration | PS-101-03.R03, PS-101-07.R02 | injected clock past expiresAt; counterparty B's deletion tombstone; P's own privacy.deletion.completed; relay applies B's signed deletion request | rows purged through the RetentionPurgePort and rollup counts kept; B's tombstone removes nothing in P's vault; P's deletion removes P's vault signals; relay signals about B pseudonymized |
| TEST-PS-101-09.T09 | integration | PS-101-06.R02, PS-101-06.R03 | transaction aborted mid-ingest; outbox dispatcher down; consumer failing 8 times | no partial row; event delivered after recovery; dead letter after 8 attempts |
| TEST-PS-101-09.T10 | abuse | PS-101-07.R01, PS-101-07.R03 | UPDATE of weight and observedAt on signal rows | aborted by trigger |
| TEST-PS-101-09.T11 | load | PS-101-08.R01, PS-101-08.R02, PS-101-08.R03 | 200 ingests per second for 5 minutes; summarize 5 000-signal subject; purge 100 000 rows; a dead-lettered event | p95 targets met, purge ≤ 30 s, dead-letter metric alerts, no keys in logs |
| TEST-PS-101-09.T12 | unit | PS-101-09.R01 | traceability tool run | every PS-101 requirement maps to a passing test |
| TEST-PS-101-09.T13 | integration | PS-101-10.R01, PS-101-10.R02, PS-101-10.R03 | vault export, import into fresh vault, relay backup restore; read a v1 row with an unknown kind with the previous reader | signals round-trip with original observedAt; imported signals marked source import with weight cap 20; unknown kind counts as manual_concern with weight 0 |
| TEST-PS-101-09.T14 | integration | PS-101-02.R04, PS-101-01.R02 | commerce.deal.completed with parties [P, B]; payment.disputed where P is the payer; auctions.result.voided without subjectKeys in a vault | deal_completed recorded only for B; no signal about P; nothing recorded for the void; unresolved_subject metric increments |
| TEST-PS-101-09.T15 | integration | PS-101-04.R04 | on relay X: action.applied remove_from_index, then reverted appeal_overturned; another applied then expired; 5 non-exempt report.dismissed for reporter R in 30 days and 1 exempt | report_actioned 15 then compensation; expired one kept; report_dismissed_bad_faith recorded once at the 5th dismissal; exempt dismissal records nothing |
| TEST-PS-101-09.T16 | contract | PS-101-04.R05 | F12.S03.M01 calls summarize with kinds and windowDays; the 5th dismissal's moderation.signal.recorded is delivered to the F12.S03.M03 contract fixture | byKind counts for the window returned, report_dismissed_bad_faith count 1 within 30 days and 0 after 31 days; F12.S03.M03 writes one reduced marker for the reporter key |
| TEST-PS-101-09.T17 | abuse | PS-101-07.R01, PS-101-02.R04 | F12 privacy suite: scan federation payloads, public projections, notifications, relay and vault logs after ingesting every mapped event | no Signal field, subject key, source key or weight appears in any of them |
| TEST-PS-101-09.T18 | integration | PS-101-07.R04 | ExportSectionPort run, DeletionPort plan and RetentionPurgePort run in a vault and on a relay | section moderation.signals exported in the vault only; deletion and purge counts reported; relay export absent |
| TEST-PS-101-09.T19 | integration | PS-101-02.R04 | commerce.dispute.resolved refund_claimed, then no_fault_close for another case, then withdrawn for a third | refund_agreed against the respondent of the matching dispute_opened signal; compensations for the other two; no dispute_lost kind exists |
| TEST-PS-101-09.T20 | contract | PS-101-04.R06, PS-101-02.R04 | F06.S02.M03 contract fixture calls SignalPort.record with proximity_pattern for a token caller twice with one sourceRef, for an anonymous caller without did:key, with an unregistered kind, with a cell in evidenceRef, and over HTTP | one signal weight 10 half-life 7 days and duplicate true on the repeat, moderation.signal.recorded once; VALIDATION_FAILED three times; no route |
| TEST-PS-101-09.T21 | integration | PS-101-04.R07, PS-101-04.R03 | rentals.damage.claimed; rentals.damage.resolved with each outcome; comms.meetup.no_show contradicted false then comms.meetup.no_show_contradicted for it; comms.meetup.no_show with contradicted true; moderation.action.applied with caseSource auction_review and auctions.result.voided with subjectKeys [seller] for the same auction | nothing for claimed; damage_agreed only for accepted, counter_accepted, refund_claimed and return_agreed; no_show then its compensation; nothing for the contradicted arrival; only auction_voided against the seller and no report_actioned |

## Acceptance criteria

- All tests T01–T21 pass in CI.
- No signal row is ever modified before expiry, and no counterparty action removes signals from another person's vault.
- Decayed totals match the closed-form formula within 1e-9 in property tests.

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
