# PS-042-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-09. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Lists the test IDs, fixtures and objective pass/fail criteria that verify PS-042-01 to PS-042-10. Tests are written in this spec only. Implementation and execution belong to a later phase.

## Requirements
- PS-042-09.R01 — Each test ID is `TEST-PS-042-yy-Tnn`, where `yy` is the process spec the test verifies. Every requirement ID in PS-042-01 to PS-042-10 maps to at least one test.
- PS-042-09.R02 — Each test has one objective pass criterion and one objective fail criterion. A test that cannot be decided by a machine or a fixed checklist is not accepted.
- PS-042-09.R03 — Contract tests run against the JSON examples in [commands_queries_events.md](commands_queries_events.md) and the schemas derived from [domain_schema.md](domain_schema.md). Consumer contract tests run for `HandoffCompleted.v1` and `HandoffCancelled.v1` (mod_return).
- PS-042-09.R04 — Acceptance covers the mobile PWA handoff screens: accessibility checks, offline queue behaviour and reconnect, in addition to relay tests.

## Fixtures
- F-A: active agreement, lessor and renter IDs as in [domain_schema.md](domain_schema.md) examples, item version 3.
- F-B: agreement cancelled, with one handoff in each state.
- F-C: two-party handoff with one confirmation, window ended 73 hours ago (expiry eligible).
- F-D: 3 reschedule proposals already used.
- F-E: note fixtures: clean text, 140-char boundary, 141 chars, URL, email, phone, messaging handle, Unicode NFC variants.
- F-F: moderator identity with `handoff.resolve`; non-party identity; blocked identity.
- F-G: clock fixtures: server time frozen; client clock +10 min.
- F-H: offline queue with 50 commands, one with expired TTL.

## Acceptance tests
| Test ID | Verifies | Scenario | Pass criterion | Fail criterion |
|---|---|---|---|---|
| TEST-PS-042-01-T01 | R01, R05 | create with F-A | one row per table; one active handoff per agreement | more than one active row, or missing transition row |
| TEST-PS-042-01-T02 | R05(b) | create with lessor = renter | `HANDOFF_PARTICIPANT_NOT_IN_AGREEMENT` and no row | any row written |
| TEST-PS-042-02-T01 | R04 | each rule VR-01 to VR-22 with one bad input | exactly one code from the catalogue, correct HTTP status | wrong code, extra code, or leaked internal detail |
| TEST-PS-042-02-T02 | R04 | non-party command with invalid body | `HANDOFF_NOT_FOUND`, not a validation error | validation error returned to non-party |
| TEST-PS-042-02-T03 | R03 | every error code | each has a `message_key` in the locale file, and an announced live region | missing key or silent error |
| TEST-PS-042-03-T01 | state table | each T01–T15 from its valid source state | target state and transition row match table | wrong target or missing row |
| TEST-PS-042-03-T02 | R02 | cancel after lessor confirmation | `HANDOFF_INVALID_STATE`, state unchanged | state changes |
| TEST-PS-042-03-T03 | R03 | expiry at window_end + 72 h + 1 min on F-C | state `expired`, reason `window_expired_unconfirmed` within 5 min | state not expired within 5 min |
| TEST-PS-042-03-T04 | R02 | reschedule unanswered for 48 h + 1 min | state `scheduled`, previous window kept | state remains `reschedule_proposed` |
| TEST-PS-042-03-T05 | R04 | renter tries to revoke own confirmation | refused with `HANDOFF_INVALID_STATE` or `HANDOFF_ALREADY_CONFIRMED`; attestation kept | attestation deleted or changed |
| TEST-PS-042-04-T01 | R03 | every mutating call without `Idempotency-Key` or `schema_version` | `HANDOFF_IDEMPOTENCY_KEY_MISSING` or `HANDOFF_SCHEMA_VERSION_UNSUPPORTED` | command applied |
| TEST-PS-042-04-T02 | R01 | JSON examples in commands spec | each example validates against its schema and the response matches the example shape | schema mismatch |
| TEST-PS-042-04-T03 | R05 | envelope consumer with unknown optional field | consumer ignores field and succeeds | consumer fails |
| TEST-PS-042-05-T01 | R01 | capability matrix, each Y/N cell | observed allow/deny equals matrix for all cells | any cell differs |
| TEST-PS-042-05-T02 | R03 | revoke `handoff.resolve` from moderator | moderator action denied within 60 s | action succeeds after 60 s |
| TEST-PS-042-05-T03 | R04 | non-party read of existing and unknown IDs | identical body and status; latency within 20 ms bucket | any difference |
| TEST-PS-042-06-T01 | R01 | same command, same key, twice | second response identical with `Idempotent-Replayed: true`; one transition row | two transition rows |
| TEST-PS-042-06-T02 | R04 | two confirmations from different parties at same revision | one succeeds; other `HANDOFF_CONFLICT_REVISION`; final state `completed` after refetch and retry | lost write or double completion |
| TEST-PS-042-06-T03 | R02 | relay killed after commit before publish | outbox event published after restart; no duplicate state change | event missing or state applied twice |
| TEST-PS-042-06-T04 | R02 | agreement service unreachable during create | `HANDOFF_UPSTREAM_UNAVAILABLE`; zero rows written | any row written |
| TEST-PS-042-06-T05 | R03 | 500 queued commands, 50 allowed | 50 accepted into queue, rest refused with visible notice; confirmations never dropped | confirmation dropped silently |
| TEST-PS-042-07-T01 | R04 | non-party probes, counterpart notes | no note text in any response for non-party; no note in logs | any leak |
| TEST-PS-042-07-T02 | R03 | log schema with forbidden keys | logger rejects each forbidden key; test fails build if one passes | forbidden key written |
| TEST-PS-042-07-T03 | R02 | note fixtures in F-E | URL, email, phone and handle rejected with `HANDOFF_NOTE_UNSAFE_CONTENT`; 140 chars accepted, 141 rejected | any mismatch |
| TEST-PS-042-07-T04 | R05 | purge job on terminal handoff 30 days old | `meeting_note` null; row present | note present, or row removed early |
| TEST-PS-042-07-T05 | R05 | legal hold set, then purge job | held record unchanged | held record changed |
| TEST-PS-042-08-T01 | R03 | axe-style automated scan of handoff screens | zero serious or critical violations | any serious or critical violation |
| TEST-PS-042-08-T02 | R01 | load test at 200 commands per second for 10 minutes | p95 ≤ 300 ms; 5xx ≤ 0.5% | either budget missed |
| TEST-PS-042-08-T03 | R03 | screen reader run on confirm and conflict flows | result announced within 1 s | not announced |
| TEST-PS-042-08-T04 | R02 | 200 commands per second sustained | p99 ≤ 1000 ms | budget missed |
| TEST-PS-042-09-T01 | R01 | coverage check | every requirement ID in PS-042-01 to PS-042-10 appears in at least one test | any uncovered requirement |
| TEST-PS-042-09-T02 | R03 | consumer contract for `HandoffCompleted.v1` in mod_return | consumer test passes against provider examples | consumer test fails |
| TEST-PS-042-10-T01 | R01 | export of one participant's records | NDJSON validates; contains only that participant's own fields and counterparty pseudonyms | other private field present |
| TEST-PS-042-10-T02 | R02 | import attempt of handoff NDJSON | `HANDOFF_FORBIDDEN`-class refusal; no rows written | rows written |
| TEST-PS-042-10-T03 | R03 | restore drill from backup to clean environment | restored row counts and last transition sequence match snapshot; RPO and RTO measured | mismatch or budget missed |
| TEST-PS-042-10-T04 | R04 | flag off, then migration rollback test | create refused with `HANDOFF_FEATURE_DISABLED`; reads and expiry still work | writes accepted while off |

## Assumptions and open decisions
- No assumptions are defined in this file.
- Open decisions in this file: none. Test execution tooling is not chosen here and belongs to Prompt 4 or later.
- Every test ID above is referenced from its process spec's requirements. Coverage check (TEST-PS-042-09-T01) is the control for completeness.
