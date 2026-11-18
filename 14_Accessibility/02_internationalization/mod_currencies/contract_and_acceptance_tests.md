# PS-112-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-09. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); contract tests are run by the platform test layer (F17).

## Purpose and scope
Defines the catalogue of contract, property, integration, abuse, offline and load tests that prove currencies behaves as specified in PS-112-01 to PS-112-10. Business outcome: a reviewer can decide pass or fail for each requirement from a test ID and a pass criterion, without interpreting prose. Exclusions: test code and CI wiring (implementation phase), and certification of security (requires independent review).

## Requirements
- PS-112-09.R01: Every test ID has a requirement link, a scenario, a fixture reference and one objective pass criterion. Actors: test authors and reviewers.
- PS-112-09.R02: Negative and abuse tests exist for every error code in validation_rules.md (the catalogue includes a coverage test).
- PS-112-09.R03: Accessibility, offline and load criteria are measurable: named metrics, thresholds and sample sizes.
- PS-112-09.R04: Fixtures are fixed and versioned (section "Fixtures"); no test depends on the wall clock.
- PS-112-09.R05: Each test ID is referenced at least once in the process file it verifies. Test IDs in the form `TEST-PS-112-NN-Tnn` follow the process number NN.
- PS-112-09.R06: A test that cannot be executed is reported as not run; it is never recorded as passed.

## Test catalogue
Layers: C = contract, U = unit, P = property, I = integration, A = abuse, O = offline, L = load.

| ID | Layer | Requirement | Scenario | Pass criterion |
|---|---|---|---|---|
| TEST-PS-112-01-T01 | I | R01 | Write attempt to each record type from non-owner principals | 100% rejected with CURRENCIES_PERMISSION_DENIED; row counts unchanged |
| TEST-PS-112-01-T02 | U | R02 | Each edge-case row in domain_schema.md | Documented error code returned; no row written |
| TEST-PS-112-01-T03 | C | R03 | List catalog; render 20 codes in screen-reader test | 100% of list items carry `name_key`; accessible name equals localized name for all 20 |
| TEST-PS-112-01-T04 | U | R03 | Serialize max-length fixture for each record type | Every record at most 2048 bytes; catalog list of 500 rows accepted, 501 rejected |
| TEST-PS-112-02-T01 | U | R01 | Negative case per rule V01..V07 | Each returns its mapped code; no write |
| TEST-PS-112-02-T02 | U | R01 | Negative and positive case per rule V08..V13 | Each returns its mapped code or succeeds as specified |
| TEST-PS-112-02-T03 | U | R04 | Rules V14..V18 with boundary values | Boundaries exactly as specified (18 digits accepted, 19 rejected; 16th pin accepted, 17th rejected) |
| TEST-PS-112-02-T04 | U | R06 | Rules V19..V23 with unknown fields and bad versions | Mapped code returned; no partial processing |
| TEST-PS-112-02-T05 | C | R03 | Error envelope for every catalogue code | Envelope contains `code`, `retryable`, `localization_key`; no free-text message |
| TEST-PS-112-03-T01 | U | R01 | Every allowed transition in the state tables | Succeeds; every disallowed pair rejected with the mapped code |
| TEST-PS-112-03-T02 | I | R05 | Withdraw quote with 1000 PINNED pins, then convert on one pin during the chunked job | Convert returns CURRENCIES_QUOTE_WITHDRAWN; all pins INVALIDATED within 300 s |
| TEST-PS-112-03-T03 | I | R06 | Run expiry sweep twice on the same due set | Second run emits zero events; state identical |
| TEST-PS-112-03-T04 | U | R04 | Pin requested with and without `subject_deadline` | `valid_until` equals the minimum of the three bounds in every case (fixture set) |
| TEST-PS-112-04-T01 | C | R01 | Validate every request and response example against schema v1 | 100% valid |
| TEST-PS-112-04-T02 | I | R04 | Replay convert with same key; send same key with different body | Replay returns identical body with `Idempotent-Replayed: true`; second returns CURRENCIES_IDEMPOTENCY_KEY_REUSED |
| TEST-PS-112-04-T03 | C | R05 | Emit each event type once | Every event validates against envelope and payload fields in the table |
| TEST-PS-112-04-T04 | C | R02 | List queries with 250 rows | Page sizes at most 100; cursor covers all rows exactly once |
| TEST-PS-112-05-T01 | A | R01 | Full matrix: each actor x action x resource cell | Allowed cells succeed; denied cells return CURRENCIES_PERMISSION_DENIED; 100% of cells match the table |
| TEST-PS-112-05-T02 | A | R02 | Probe pin read with an unknown subject and an unauthorized subject | Responses byte-identical after removing request_id |
| TEST-PS-112-05-T03 | I | R04 | Re-enable a DISABLED code with the same operator twice; with two operators | First attempt rejected; second succeeds |
| TEST-PS-112-05-T04 | I | R06 | Revoke importer principal; attempt publish | Publish rejected within 5 s of revocation |
| TEST-PS-112-06-T01 | I | R02 | Fault injection: storage delay 1.5 s on publish, pin and convert | Each returns CURRENCIES_UNAVAILABLE within its server deadline; no row written |
| TEST-PS-112-06-T02 | I | R01 | Same key replayed 5 times; key reused with different body | One row created; replays return stored response; reuse returns 409 |
| TEST-PS-112-06-T03 | I | R04 | Two concurrent release and convert on one pin, 200 repetitions | Exactly one succeeds in each repetition; no conversion for a released pin |
| TEST-PS-112-06-T04 | I | R05 | Crash injection after row write, before outbox commit | Zero rows and zero events persisted |
| TEST-PS-112-06-T05 | I | R06 | Corrupt pin status, then run reconciliation | Status restored from events; a corrupted conversion row triggers the mismatch alert and is not modified |
| TEST-PS-112-07-T01 | A | R02 | Operator-less publish from SVC_FX with 25% move; publish with allowlisted source and 19% move | 25% rejected with CURRENCIES_QUOTE_OUTLIER; 19% accepted |
| TEST-PS-112-07-T02 | A | R02 | Replay convert from a second principal with copied key | Second principal receives CURRENCIES_PERMISSION_DENIED or its own key scope; no second row |
| TEST-PS-112-07-T03 | A | R05 | Public catalog, quote feed and public events scanned for subject refs and preferences | Zero matches; identical 403 for unknown and unauthorized subjects |
| TEST-PS-112-07-T04 | A | R05 | Scan logs and event payloads from 1000 operations for amounts and personal refs | Zero matches for forbidden fields |
| TEST-PS-112-07-T05 | A | R01 | Each non-operator principal attempts quote publish via user API | 100% rejected; no quote written |
| TEST-PS-112-07-T06 | A | R01 | Scan analytics and logs after preference set | Zero occurrences of `display_code` values |
| TEST-PS-112-07-T07 | O | R03 | Client loads quote, goes offline past `expires_at`, reconnects | Client shows expired badge; server rejects pin with CURRENCIES_QUOTE_EXPIRED |
| TEST-PS-112-07-T08 | I | R04 | Delete account with open dispute, with closed subject and no hold | Dispute: retention basis `DISPUTE_OPEN`; closed: evidence kept with tombstone ref; preference removed within 30 days |
| TEST-PS-112-08-T01 | U | R01 | Scan metric label names and values in staging | No forbidden label present |
| TEST-PS-112-08-T02 | U | R03 | Emit log lines with forbidden fields injected | Forbidden fields dropped at emitter; 100% of injected fields absent |
| TEST-PS-112-08-T03 | I | R04 | Drill: stop scheduler for 150 s with an expired quote | Stale-quote alert fires within 120 s of threshold; clears within 60 s after restart |
| TEST-PS-112-08-T04 | L | R02 | Load run per budget table | Measured p95 and p99 at or below budget for each operation |
| TEST-PS-112-09-T01 | C | R02 | Coverage: each code in validation_rules.md has at least one test that produces it | 100% coverage of catalogue codes |
| TEST-PS-112-09-T02 | C | R06 | Compare codes emitted by code against catalogue | No undocumented code emitted; no catalogue code missing |
| TEST-PS-112-09-T03 | P | R04 | Random conversions with fixture rates across four rounding policies, 100000 cases | 0 mismatches against reference decimal implementation |
| TEST-PS-112-09-T04 | L | R03 | Convert at 200 requests per second for 10 minutes | p95 at most 150 ms; error rate at most 0.1% |
| TEST-PS-112-09-T05 | C | R01 | Subject module stub contract: pin, release, convert, read | Stub behaves per documented signatures; no undocumented field used |
| TEST-PS-112-09-T06 | O | R03 | Offline pending queue behavior with reconnect | No currencies write committed offline; pending writes sent with same key after reconnect |
| TEST-PS-112-09-T07 | C | R01 | Unsupported `schema_version` on every command | 100% rejected with CURRENCIES_SCHEMA_VERSION_UNSUPPORTED |
| TEST-PS-112-09-T08 | I | R05 | Publish, pin, convert then reconcile after restart | Final state matches event log; zero mismatch |
| TEST-PS-112-09-T09 | C | R04 | Replay a recorded event stream into a second instance | Projected state equal to source state |
| TEST-PS-112-09-T10 | A | R03 | Post a signed envelope to any import or federation route; scan public feed for federation-only fields | Every post rejected with CURRENCIES_INVALID_REQUEST; zero federation-only fields in public feed |
| TEST-PS-112-10-T01 | I | R02 | Import dry-run with 10 invalid rows | No writes; report lists all 10 rows with codes |
| TEST-PS-112-10-T02 | I | R02 | Import batch failing at quote 1500 of 2000 | Zero rows from the batch persisted |
| TEST-PS-112-10-T03 | I | R01 | Submit same batch twice | Second submit returns stored report; zero new rows |
| TEST-PS-112-10-T04 | A | R01 | Import files over 1 MiB, 501 definitions, 2001 quotes | Each rejected with CURRENCIES_IMPORT_TOO_LARGE before parsing rows |
| TEST-PS-112-10-T05 | I | R03 | Catalog export and subject export | Catalog export has no subject refs; subject export contains only the requester's subjects |
| TEST-PS-112-10-T06 | I | R05 | Restore from backup taken 10 minutes before a quote withdrawal | After reconciliation the withdrawn quote is WITHDRAWN and its pins INVALIDATED |
| TEST-PS-112-10-T07 | C | R06 | Attempt hard delete of quote, pin or conversion through any API | 100% rejected; only status transitions succeed |

## Fixtures
Fixed values, used by all tests unless a test states otherwise. Clock is injected and fixed at `2026-11-10T07:00:00Z` for deterministic tests.

| Fixture | Value |
|---|---|
| FX-CAT-01 | EUR, FIAT, numeric 978, exponent 2, ACTIVE |
| FX-CAT-02 | USD, FIAT, numeric 840, exponent 2, ACTIVE |
| FX-CAT-03 | JPY, FIAT, numeric 392, exponent 0, ACTIVE |
| FX-CAT-04 | BHD, FIAT, numeric 048, exponent 3, ACTIVE |
| FX-CAT-05 | LUA, LOCAL_UNIT, numeric null, exponent 2, ACTIVE |
| FX-QT-01 | EUR to USD, rate `1.085`, source `ops_daily_table`, as_of `2026-11-10T06:00:00Z`, TTL 60 min |
| FX-QT-02 | JPY to EUR, rate `0.0061`, same source and TTL |
| FX-QT-03 | USD to BHD, rate `0.376`, same source and TTL |
| FX-SUBJ-01 | CYCLE subject `cyc_FIXTURE01` with participants `usr_FIX1` and `usr_FIX2` |
| FX-SUBJ-02 | LISTING subject `lst_FIXTURE02`, party `usr_FIX1` only |
| FX-ACT-01 | Operator `act_op_FIX1`; second operator `act_op_FIX2` |
| FX-ACT-02 | Subject service `svc_mutiny_FIX1`; FX importer `svc_fx_FIX1` |
| FX-EXP-01 | Reference conversion: input `1250` EUR-minor to USD via FX-QT-01 gives output `1356`, exact `1356.25`, HALF_EVEN |
| FX-EXP-02 | Reference conversion: input `5000` JPY-minor to EUR via FX-QT-02 gives exponent-adjusted output `3050` |

No fixture contains real personal data. All refs are synthetic.

## Acceptance criteria for this process
- Every test ID listed in the catalogue maps to a requirement in one of PS-112-01..PS-112-10 and every process file cites at least one test ID.
- Every error code in validation_rules.md is produced by at least one test (TEST-PS-112-09-T01).
- Each pass criterion is a number, a count, a status code, or an equality check. No criterion relies on reviewer judgement except TEST-PS-112-01-T03, which uses a fixed screen-reader sample.
- Load and latency criteria use the budgets in observability_performance.md.

## Open decisions
- Test layer assignment (F17 test platform) is provisional until F17 publishes its layer definitions.
- Screen-reader sample for TEST-PS-112-01-T03 is fixed at 20 codes; expansion is an open review item.
- Related: D03 (valuation rules that tests exercise), D08 (offline tests depend on the chosen pending queue design).
