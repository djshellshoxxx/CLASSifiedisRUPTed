# PS-077-09 — Contract and acceptance tests: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-09.R01** Every requirement is covered by at least one automated test.
- **PS-077-09.R02** Execution is tested with a controllable clock and stub DeletionPorts for every module including failing ones.
- **PS-077-09.R03** The no-resurrection property is tested by restoring an old export after completion.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded vault with listings, messages, deals, receipts, an open committed cycle, two device keys, a recovery kit and two relays (one offline); stub DeletionPorts for every module including F11.S01.M02, F10.S01.M01 and F07.S01.M01 that record call order; relay double with a key registry; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-02.R01, PS-077-07.R03 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T02 | unit | PS-077-03.R01, PS-077-03.R04 | cancel at day 13; try to cancel while executing | cancelled with salt destroyed and privacy.deletion.cancelled emitted; executing refuses with CONFLICT_STATE |
| TEST-PS-077-09.T03 | unit | PS-077-02.R02, PS-077-03.R02 | commitments open at day 14, then clear at day 20, then limit reached | deferred then executing; at day 44 execution proceeds with notices sent |
| TEST-PS-077-09.T04 | integration | PS-077-03.R03, PS-077-06.R02, PS-077-06.R03 | kill the app after each step and reopen | execution resumes from persisted state; keys destroyed only after all earlier steps done |
| TEST-PS-077-09.T05 | property | PS-077-03.R01 | random event and time sequences | only declared transitions succeed; completed and cancelled have no exits |
| TEST-PS-077-09.T06 | contract | PS-077-01.R01, PS-077-01.R05, PS-077-04.R01, PS-077-04.R02, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | entity, statements, tombstones and events validate against registry schemas; deletion_statement and deletion_notice payloads contain exactly the allowlisted fields |
| TEST-PS-077-09.T07 | integration | PS-077-07.R01, PS-077-01.R04 | complete deletion with keepEvidence true then false | true keeps a pseudonymized evidence-only vault in the residue store and deletes content; false also purges own evidence copies; pseudonym stable across modules |
| TEST-PS-077-09.T08 | abuse | PS-077-02.R03, PS-077-05.R01, PS-077-05.R02, PS-077-05.R03 | relay_apply with a statement signed by another did; operator tries to start deletion; suspended on a relay; user reads the relay result | rejected or FORBIDDEN; deletion by owner still allowed; result carries someRetained without a count |
| TEST-PS-077-09.T09 | integration | PS-077-06.R01 | replay same command ID; offline execution with an offline relay | original result; completion with relay shown prepared |
| TEST-PS-077-09.T10 | integration | PS-077-01.R02, PS-077-07.R02 | after completion inspect storage and UI summary | content gone, salt destroyed, did removed, pseudonym recorded, this-device-only notice, recovery-kit warning, cannot-recall notice and relay-hold notice displayed |
| TEST-PS-077-09.T11 | chaos | PS-077-01.R03 | restore an old export into this browser profile after completion and inspect the ledger | restore flow refuses the deleted principal via privacy.deletion.ledger_check unless the user overrides with a new identity; the ledger entry holds only ledgerKey and ledgerUntil |
| TEST-PS-077-09.T12 | abuse | PS-077-02.R04 | publish a listing, open a deal, commit a cycle, book a service and reserve a rental during grace through module doubles that call the guard | each refused with PRIVACY_DELETION_PENDING |
| TEST-PS-077-09.T13 | load | PS-077-08.R01, PS-077-08.R02, PS-077-08.R03 | 10 000 records and 200 MB blobs; 100-tombstone relay batch | ≤ 120 s; relay p95 ≤ 500 ms; main-thread block ≤ 50 ms; no telemetry sent |
| TEST-PS-077-09.T14 | unit | PS-077-09.R01, PS-077-09.R03, PS-077-02.R02, PS-077-04.R04 | traceability tool run and the DeletionPort CI conformance check with a module without a port and one whose execute differs between runs | every PS-077 requirement maps to a passing test; build fails for a module without a plan or with non-idempotent steps |
| TEST-PS-077-09.T15 | e2e | PS-077-07.R02 | user flow on two devices with banner, cancel and final summary | banner and summary shown with the this-device limit and the other-device warning; axe zero serious issues |
| TEST-PS-077-09.T16 | integration | PS-077-10.R01, PS-077-10.R02, PS-077-10.R03 | export before deletion, import into fresh vault, roll back one release | export contains the request metadata only; ledger survives rollback |
| TEST-PS-077-09.T17 | abuse | PS-077-02.R03 | relay_apply with a statement signed 31 days ago, a replayed batch with changed content, a statement signed by a key revoked for compromise, and a valid statement delivered on day 3 after the account_deleted revocation | first three PRIVACY_DELETION_STATEMENT_INVALID; an exact replay is a no-op; the day-3 statement is accepted because the revocation lists its cid |
| TEST-PS-077-09.T18 | integration | PS-077-01.R03 | clock advanced 181 days after completion | ledger entry and ledger salt purged by the RetentionPurgePort; ledger_check returns deleted false and the UI no longer warns |
| TEST-PS-077-09.T19 | integration | PS-077-04.R03, PS-077-04.R05 | deferred request with each of the nine commitment events; consumer doubles of requested that try to purge and of completed that try to sign; cancel during grace | blockers re-evaluated on each event; the purging and signing doubles fail the conformance check; after cancel privacy.deletion.cancelled undoes hide and pause, consents are unchanged and no outbox entry exists for any relay or counterparty |
| TEST-PS-077-09.T20 | integration | PS-077-03.R03, PS-077-04.R04 | execution with recording stub ports for F11.S01.M02, F10.S01.M01, F07.S01.M01 and a blob module | every sign step (tombstones, consent withdrawals, deletion statements, notices) runs before revoke_keys, nothing is signed after it, destroy_keys runs last, and F11.S01.M02 issues tombstones only at execution |
| TEST-PS-077-09.T21 | integration | PS-077-01.R04, PS-077-01.R03 | inspect the residue store and every vault database after completion | only the residue request without did or salt, ledger entries keyed by HMAC, pending outbox entries and, with keepEvidence, the pseudonymized evidence vault remain; no record joins the did and the pseudonym |
| TEST-PS-077-09.T22 | e2e | PS-077-07.R02, PS-077-01.R04 | restore the pre-deletion export on a fresh device after completion | restore succeeds on that device, documenting the limit that the UI and completion summary stated |
| TEST-PS-077-09.T23 | integration | PS-077-01.R04, PS-077-06.R01 | relay offline at execution returns on day 3, a second relay returns on day 29, a third never returns | residue outbox delivers on day 3 and day 29 and both relays accept; the third entry is dropped after 30 days and the summary shows it never acknowledged |
| TEST-PS-077-09.T24 | contract | PS-077-01.R05 | deletion notice for an open cycle captured at a relay double and opened by counterparty doubles | relay sees only ciphertext, mailbox ID and size; counterparties decrypt, verify signer role principal and see exactly the allowlisted fields |

## Acceptance criteria

- All tests T01 to T24 pass in CI.
- After completion no module on this device retains content or recoverable keys for the principal, retained evidence carries only the pseudonym, and no record joins the did and the pseudonym.
- The grace period of 14 days cannot be shortened by any API.
- The completion summary always states what cannot be recalled and that the guarantee covers this device only.

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
