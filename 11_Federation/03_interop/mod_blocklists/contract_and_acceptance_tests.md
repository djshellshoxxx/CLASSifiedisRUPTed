# PS-089-09 — Contract and acceptance tests: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-089-09.R02** Tests prove that block rules are applied before storage and that imports never self-activate.
- **PS-089-09.R03** Contract tests validate commands, the blocklist statement and events against registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay B, authors X and Bad, cids C1 and C2, content hash H1, signed blocklist L with 3 entries by publisher P, fake clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T01 | unit | PS-089-01.R01, PS-089-01.R03, PS-089-02.R01 | add one rule of each type with valid values | rules active with exact-match values and event emitted |
| TEST-PS-089-09.T02 | unit | PS-089-02.R02, PS-089-02.R03, PS-089-01.R02 | each rule V01–V07 violated | documented code and no rule changed |
| TEST-PS-089-09.T03 | integration | PS-089-03.R01, PS-089-03.R02 | import list L then approve one of 3 entries | 3 pending, 1 active, 2 stay pending then removed by reject; none active before review |
| TEST-PS-089-09.T04 | property | PS-089-03.R01, PS-089-03.R03 | random command sequences on one rule | only declared transitions succeed; expired and removed never change |
| TEST-PS-089-09.T05 | integration | PS-089-04.R01, PS-089-04.R02, PS-089-06.R03 | rule blocks author Bad with 5 mirrors present | mirrors purged within 1 h via federation.block_rule.changed consumer; later tombstone from Bad still applied |
| TEST-PS-089-09.T06 | integration | PS-089-04.R03, PS-089-02.R01 | identity.block.added then removed for a party with a did | local hide rule created then removed; federated content hidden then visible |
| TEST-PS-089-09.T07 | contract | PS-089-04.R01, PS-089-04.R02, PS-089-09.R02 | each command, query and the blocklist statement | validate against registry schemas |
| TEST-PS-089-09.T08 | abuse | PS-089-05.R01, PS-089-05.R02, PS-089-05.R03 | other vault reads rules; external evaluate call; non-operator edits relay rules | NOT_FOUND or FORBIDDEN |
| TEST-PS-089-09.T09 | integration | PS-089-06.R01, PS-089-06.R02 | replay import with same key; kill import midway | first response replayed; no partial pending rules |
| TEST-PS-089-09.T10 | integration | PS-089-06.R03, PS-089-05.R03 | rule added while a batch is in flight | batch uses start snapshot; next batch applies the rule |
| TEST-PS-089-09.T11 | abuse | PS-089-07.R01, PS-089-07.R02 | send blocked and unknown authors to the inbox and compare responses | identical FEDERATION_NOT_ACCEPTED or accepted shape; evaluate not reachable from outside |
| TEST-PS-089-09.T12 | abuse | PS-089-07.R03, PS-089-07.R02 | import list with 10001 entries, from unknown publisher, 6th import in a day | FEDERATION_BLOCKLIST_TOO_LARGE, import allowed to review only, RATE_LIMITED |
| TEST-PS-089-09.T13 | load | PS-089-08.R01, PS-089-08.R02, PS-089-08.R03 | evaluate 100000 envelopes against 100000 rules; import 10000 entries | p95 ≤ 0.5 ms and import ≤ 2 s |
| TEST-PS-089-09.T14 | a11y | PS-089-03.R01, PS-089-04.R01 | operate import review by keyboard and screen reader | all rows labelled, targets ≥ 44 px, announcements present |
| TEST-PS-089-09.T15 | unit | PS-089-09.R01, PS-089-09.R03 | traceability tool run | every PS-089 requirement maps to a passing test |
| TEST-PS-089-09.T16 | integration | PS-089-10.R01, PS-089-10.R02, PS-089-10.R03 | export rules, import into fresh vault | rules round trip as written; imported-source rules return to pending_review |

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Block rules are evaluated before any record is stored (integration test with storage spy).
- An imported list never activates a rule without explicit per-rule review.

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
