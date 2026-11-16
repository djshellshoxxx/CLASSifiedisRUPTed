# PS-102-09 — Contract and acceptance tests: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-102-09.R02** Contract tests use the dev log adapter and a fake SMTP server and verify headers, bodies and bounce handling.
- **PS-102-09.R03** Privacy tests assert that no address appears outside encrypted storage and no user content appears in any email.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with EmailTransportPort (fake SMTP and log adapter), user U with granted email consent, addresses alex@example.org and a blocked disposable domain, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01, PS-102-02.R02 | add valid, invalid and disposable-domain addresses | valid stored encrypted with masked output; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID |
| TEST-PS-102-09.T02 | unit | PS-102-02.R03, PS-102-01.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing sent |
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R02 | send a template email through the fake SMTP server | subject and body are generic, contain app origin link only, headers List-Unsubscribe and List-Unsubscribe-Post present, DKIM-signed by the adapter, no user content |
| TEST-PS-102-09.T04 | property | PS-102-03.R01, PS-102-03.R02, PS-102-03.R03 | random sequences of add, verify, bounce, remove, expiry | terminal states never change; bounce stops sends; removal erases ciphertext within 24 h |
| TEST-PS-102-09.T05 | contract | PS-102-04.R01, PS-102-04.R02, PS-102-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-102-09.T06 | integration | PS-102-04.R03 | channel opted out, deletion requested | queued deliveries cancelled, address removed within 24 h |
| TEST-PS-102-09.T07 | abuse | PS-102-05.R01, PS-102-05.R02, PS-102-05.R03 | add by unknown key; verify with guessed token; external call to send; operator query for cleartext | refused or masked; no cleartext available except in adapter at send time |
| TEST-PS-102-09.T08 | integration | PS-102-06.R01, PS-102-06.R02, PS-102-06.R03 | verify twice, retry on 4xx, crash after SMTP accept | one verified transition, 3 attempts max, one repeated submission with same Message-ID |
| TEST-PS-102-09.T09 | abuse | PS-102-07.R01, PS-102-07.R02, PS-102-07.R03 | inspect database, logs, events, exports; 6th verification mail in a day; 21st email in a day | no address outside encrypted storage; RATE_LIMITED and NOTIFY_EMAIL_NOT_DELIVERABLE |
| TEST-PS-102-09.T10 | integration | PS-102-07.R03, PS-102-02.R03 | hard bounce, 3 soft bounces, complaint | address bouncing and sends stop; complaint withdraws email consent |
| TEST-PS-102-09.T11 | load | PS-102-08.R01, PS-102-08.R02, PS-102-08.R03 | 50 emails per second for 5 minutes with 6 percent injected bounces | latency within budget and bounce alert fires |
| TEST-PS-102-09.T12 | unit | PS-102-09.R01, PS-102-09.R03 | traceability tool run | every PS-102 requirement maps to a passing test |
| TEST-PS-102-09.T13 | integration | PS-102-10.R01, PS-102-10.R02, PS-102-10.R03 | export from vault, restore relay from backup | export has no addresses; restored unverified addresses older than 7 days removed; verified ones require a send probe |
| TEST-PS-102-09.T14 | a11y | PS-102-04.R01 | settings screen and verification page with screen reader and without JavaScript | labelled input, page works, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- No email is sent without verified address and granted consent, and each email carries one-click unsubscribe headers.
- Emails contain no listing, message, name or amount content in any test.
- Addresses never appear in logs, events, exports or query results.

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
