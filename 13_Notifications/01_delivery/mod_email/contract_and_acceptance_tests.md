# PS-102-09 — Contract and acceptance tests: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-102-09.R02** Contract tests use the dev log adapter and a fake SMTP server and verify headers, bodies and bounce handling.
- **PS-102-09.R03** Privacy tests assert that no address appears outside the vault target and encrypted relay storage and no user content appears in any email.
- **PS-102-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues, a keyboard and screen-reader walk-through and a no-JavaScript run of the verification page.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with EmailTransportPort (fake SMTP, log adapter, VERP key, one configured feedback-loop source and a provider webhook key), F16.S02.M02 registry double, users U and V with registered email consent, addresses alex@example.org and a blocked disposable domain, a /24 with 50 fresh DIDs, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01 | add valid, invalid and disposable-domain addresses through vault enable and the relay | valid stored encrypted at the relay with masked output and locale; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID in the vault and at the relay |
| TEST-PS-102-09.T02 | unit | PS-102-02.R03, PS-102-02.R02 | each rule V01 to V11 violated in turn | documented error code returned and nothing sent |
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R04, PS-102-09.R02 | send every template kind through the fake SMTP server | subject and body generic with the app origin link only; List-Unsubscribe URL from UnsubscribeTokenPort works on POST; List-Unsubscribe-Post and VERP Return-Path present; DKIM-signed; no user content |
| TEST-PS-102-09.T04 | property | PS-102-03.R01, PS-102-03.R02, PS-102-03.R03 | random sequences of add, verify, authenticated bounces, remove, withdrawal and expiry | terminal states never change; queued deliveries cancel on removal and withdrawal; ciphertext erased within 24 h |
| TEST-PS-102-09.T05 | contract | PS-102-04.R01, PS-102-04.R02, PS-102-09.R02 | each command and query executes in its environment | outputs and event payloads validate against registry schemas; relay events in the SQLite transaction and the vault event in the IndexedDB transaction of the change |
| TEST-PS-102-09.T06 | integration | PS-102-04.R03, PS-102-03.R03 | relay-local notify.channel.opted_out for email to the relay instance; vault-local opted_out, privacy.deletion.requested and privacy.deletion.completed to the vault instance | relay cancels queued deliveries and erases ciphertext; vault target removed; deletion request only shows paused and erases nothing; completed signs nothing |
| TEST-PS-102-09.T07 | abuse | PS-102-05.R01, PS-102-05.R02, PS-102-05.R03 | add by unknown key; add and remove signed by a device key revoked in F16.S02.M02; verify with guessed token; external call to send; operator query for cleartext | UNAUTHENTICATED for unknown and revoked keys and the address unchanged; other calls refused or masked; no cleartext available except in the adapter at send time |
| TEST-PS-102-09.T08 | integration | PS-102-06.R01, PS-102-06.R02, PS-102-06.R03 | verify twice, retry on 4xx, crash after SMTP accept, dispatchRef repeated | one verified transition, 3 attempts max, one repeated submission with the same Message-ID, one delivery per dispatchRef |
| TEST-PS-102-09.T09 | abuse | PS-102-07.R01, PS-102-07.R02, PS-102-07.R03, PS-102-09.R03 | inspect vault, relay database, logs, events and exports | address only in the vault target and relay ciphertext; no content in emails; consent text names what the operator learns |
| TEST-PS-102-09.T10 | integration | PS-102-03.R05, PS-102-02.R04 | one authenticated hard bounce, a second within 72 h, 3 authenticated soft bounces, one signed provider event, a complaint from the configured feedback loop, a bounce for a settled delivery | bouncing only after the thresholds; complaint registers a withdrawal via unsubscribe_link; settled row unchanged while the address becomes bouncing and notify.email.bounced is emitted |
| TEST-PS-102-09.T11 | load | PS-102-08.R01, PS-102-08.R02, PS-102-08.R03 | 50 emails per second for 5 minutes with 6 percent injected bounces | latency within budget and bounce alert fires |
| TEST-PS-102-09.T12 | unit | PS-102-09.R01 | traceability tool run | every PS-102 requirement maps to a passing test |
| TEST-PS-102-09.T13 | integration | PS-102-10.R01, PS-102-10.R02, PS-102-10.R03, PS-102-01.R04 | export from the vault; restore the relay from a backup that lacks the address; import the export into a fresh vault | export holds the email target with the cleartext address and no relay copy; restore fails stale queued deliveries; the vault offers re-add from its target and re-verification after confirmation |
| TEST-PS-102-09.T14 | a11y | PS-102-09.R04 | settings screen and verification page with screen reader, keyboard and without JavaScript | labelled input, page works, zero serious axe issues |
| TEST-PS-102-09.T15 | integration | PS-102-03.R04 | relay copy becomes bouncing; vault runs sync_status at app open | vault target becomes bouncing and vault-local notify.email.bounced is emitted once; the inbox shows notify.tpl.security.email_stopped |
| TEST-PS-102-09.T16 | abuse | PS-102-07.R04, PS-102-02.R02 | one DID loops add and remove over 10 addresses; 50 DIDs from one /24 each add an address; a victim V verifies alex@example.org after attacker U requested 5 links for it | per-user and per-prefix limits return RATE_LIMITED; relay-wide cap alert at 80 percent; V still receives its verification mail |
| TEST-PS-102-09.T17 | abuse | PS-102-07.R05, PS-102-05.R04 | forged DSN at the plain bounce address quoting a real Message-ID; DSN with a wrong VERP tag; ARF report from an unknown source; unsigned webhook | each refused NOTIFY_EMAIL_REPORT_UNVERIFIED; address stays verified; consent unchanged |
| TEST-PS-102-09.T19 | e2e | PS-102-07.R03, PS-102-05.R03, PS-102-07.R02 | open the email settings, the opt-in sheet and the example email preview | text says the relay operator can read the address it sends to, that email links the address to the pseudonym at that operator, and the preview shows only the generic subject and app link |
| TEST-PS-102-09.T18 | integration | PS-102-04.R05, PS-102-01.R04 | DeletionPort plan and purge, export section and retention purge with F10 registry doubles; enable with privacy.consent.check not granted | purge deletes the vault targets; section notify.email exported; delivery rows purged after 30 days; enable refused PRECONDITION_FAILED before anything is sealed |

## Acceptance criteria

- All tests T01 to T19 pass in CI.
- No email is sent without a verified address and a granted registered consent, and each email carries one-click unsubscribe headers and a VERP return path.
- Emails contain no listing, message, name or amount content in any test.
- Addresses never appear in logs, events, relay exports or query results, and no unauthenticated report changes an address or a consent.

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
