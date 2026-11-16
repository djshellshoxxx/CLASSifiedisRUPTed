# PS-103-09 — Contract and acceptance tests: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-103-09.R02** A routing table test asserts every routed event type exists in the catalog emits and has category, template, recipient rule and collapse key.
- **PS-103-09.R03** Contract tests check commands, queries and event payloads against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U as seller of listing L and buyer elsewhere, routing table of 49 events, blocked user X, muted thread M, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T01 | unit | PS-103-01.R01, PS-103-01.R02, PS-103-01.R03, PS-103-02.R01 | route bazaar.offer.made to seller U | Notification stored with category offers, template notify.tpl.offers.made, ref offer, no text fields |
| TEST-PS-103-09.T02 | unit | PS-103-02.R02, PS-103-02.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing stored |
| TEST-PS-103-09.T03 | property | PS-103-03.R01, PS-103-03.R02, PS-103-03.R03 | random sequences of events within and beyond 10-minute windows, reads and sweeps | count equals collapsed events; read never reopens; new window creates new row |
| TEST-PS-103-09.T04 | contract | PS-103-04.R01, PS-103-04.R02, PS-103-09.R02 | create, mark_read, mark_all_read, list, unread_count execute | outputs and event payloads validate against registry schemas |
| TEST-PS-103-09.T05 | contract | PS-103-04.R03, PS-103-09.R03 | iterate the routing table | every routed type is in modules.yaml emits, has recipient rule and collapse key, urgent only on 3 security templates |
| TEST-PS-103-09.T06 | integration | PS-103-04.R03, PS-103-06.R01 | deliver each event type twice, shuffled | exactly one row per rule, duplicates skipped |
| TEST-PS-103-09.T07 | abuse | PS-103-05.R01, PS-103-05.R02, PS-103-05.R03 | event from blocked X; event with unverified statement; foreign actor tries to create or read rows | no row; no external access |
| TEST-PS-103-09.T08 | integration | PS-103-06.R02, PS-103-06.R03 | 100 concurrent offer events for one listing; template render failure | one collapsed row count 100; fallback text on render failure |
| TEST-PS-103-09.T09 | integration | PS-103-06.R03, PS-103-02.R03 | muted thread message; category with in-app off; security category with in-app preference attempt to disable | muted flag set, no row for off category except counters, security row always created |
| TEST-PS-103-09.T10 | abuse | PS-103-07.R01, PS-103-07.R02, PS-103-07.R03 | 51st event from one actor in a day; 501st row; inspect exported diagnostics | hidden counter increments, cap removes read rows first, no content in exports |
| TEST-PS-103-09.T11 | load | PS-103-08.R01, PS-103-08.R02, PS-103-08.R03 | 1 000 events catch-up and list of 50 items | budgets met |
| TEST-PS-103-09.T12 | unit | PS-103-09.R01 | traceability tool run | every PS-103 requirement maps to a passing test |
| TEST-PS-103-09.T13 | integration | PS-103-10.R01, PS-103-10.R02, PS-103-10.R03 | export, import into fresh vault, restore from backup | rows round trip; imported rows older than 30 days dropped; unread counts equal |
| TEST-PS-103-09.T14 | a11y | PS-103-04.R01 | inbox with screen reader and keyboard | list semantics, unread state in text, mark all read announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- Every routed event exists in the catalog and the inbox never stores text content.
- Security notifications are created regardless of the in-app preference.
- Duplicate event delivery never creates a second row.

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
