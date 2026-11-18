# PS-059-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-09.R01 | Every command, state, event and code has a named contract test. | MVP |
| PS-059-09.R02 | Build fails on unversioned schema change. | MVP |
| PS-059-09.R03 | Corpus of malformed, polyglot, bomb and metadata-laden files run in CI. | MVP |
| PS-059-09.R04 | Scanner integration tested with the EICAR test signature in staging only. | MVP |
| PS-059-09.R05 | Upload and viewer flows pass a11y checks. | MVP |
| PS-059-09.R06 | Cross-module test with mod_private for commit and participation. | MVP |

## Data / schema
| Fixture | Content |
|---|---|
| `fx_att_types` | valid and mismatched MIME files |
| `fx_att_bomb` | decompression bombs and oversize images |
| `fx_att_meta` | GPS, XMP, device-tagged images |
| `fx_att_pdf` | PDFs with and without active content |
| `fx_att_eicar` | test signature (staging only) |

## Commands / queries / events
Covered by [commands_queries_events.md](commands_queries_events.md) tests.

## States & transitions
Oracle: [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Registry lint for `ATTACH.*` codes.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection from PS-059-06 nightly.

## Privacy, retention, abuse
Metadata and retention fixtures from PS-059-07 every build.

## Observability & budgets
Metric names asserted against PS-059-08.

## Tests
- TEST-PS-059-09-01 (contract): payloads validate.
- TEST-PS-059-09-02 (lint): error registry.
- TEST-PS-059-09-03 (corpus): malformed corpus rejected or re-encoded per rules.
- TEST-PS-059-09-04 (integration): upload → scan → send → download by participant; download refused to others.
- TEST-PS-059-09-05 (a11y): upload and view flows.
- TEST-PS-059-09-06 (load): nightly budget run.

## Acceptance criteria
1. 100% coverage by named tests.
2. Corpus results match expected outcomes.
3. Unversioned schema change fails build.
4. Metadata and participant-only fixtures pass.

## Assumptions & open decisions
- ASSUMPTION: scanner is an audited engine chosen in the research record (pending).
