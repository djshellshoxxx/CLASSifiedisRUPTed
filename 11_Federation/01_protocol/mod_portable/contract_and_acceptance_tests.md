# PS-083-09 — Contract and acceptance tests: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-083-09.R02** A privacy test suite enumerates every field of every source record type and proves non-allowlisted fields never appear in a draft.
- **PS-083-09.R03** Round-trip tests prove that a draft payload maps back to an equal mirror view.

## Specification

See the module test table below (all processes).

**Fixtures:** Listing, profile and offering fixtures with P0..P3 fields populated including a home address, exact lat/lon, geohash 7 and a GPS-tagged image; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01, PS-083-09.R03 | random records with random extra fields and geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 |
| TEST-PS-083-09.T03 | unit | PS-083-02.R01, PS-083-07.R02, PS-083-09.R02 | record with homeAddress, email, exact lat/lon, geohash 7 | export refused or truncated per V03/V04 and codes returned |
| TEST-PS-083-09.T04 | unit | PS-083-02.R03, PS-083-02.R01 | record with opt-in false, then opt-in revoked between preview and build | FEDERATION_NOT_OPTED_IN |
| TEST-PS-083-09.T05 | unit | PS-083-02.R02, PS-083-02.R03 | inbound payload with extra member, 65537 bytes, unknown type version | FEDERATION_PAYLOAD_INVALID, PAYLOAD_TOO_LARGE, UNSUPPORTED_SCHEMA_VERSION |
| TEST-PS-083-09.T06 | unit | PS-083-01.R03, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values |
| TEST-PS-083-09.T08 | unit | PS-083-04.R03, PS-083-05.R01 | inspect module for event emission and authorization calls | none present; opt-in read happens at build time |
| TEST-PS-083-09.T09 | integration | PS-083-03.R03, PS-083-05.R02, PS-083-05.R03 | draft then sign then ingest then toMirrorView | mirror view equals source P0 fields, labelled remote, no private fields |
| TEST-PS-083-09.T10 | unit | PS-083-06.R01, PS-083-06.R02, PS-083-06.R03 | identical inputs twice; concurrent builds with same head; missing head | identical drafts; second ingest returns CONFLICT_STATE; missing head returns VALIDATION_FAILED |
| TEST-PS-083-09.T11 | a11y | PS-083-07.R03 | open consent preview with screen reader and keyboard only | every field and the linkability notice are announced, controls ≥ 44 px |
| TEST-PS-083-09.T12 | abuse | PS-083-07.R02, PS-083-07.R03 | inbound payload with script tag and long link text | stored as plain text and rendered escaped |
| TEST-PS-083-09.T13 | load | PS-083-08.R02, PS-083-08.R01 | 10 000 draft builds of 4 KiB records | p95 ≤ 1 ms, counters exported |
| TEST-PS-083-09.T14 | unit | PS-083-08.R03, PS-083-09.R01 | coverage and traceability tools run | allowlist report produced; every PS-083 requirement maps to a passing test |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-02.R01 | roleFor for listing, acceptance and consent statement types with correct and wrong signers | correct signer accepted; wrong signer yields a rule that makes F11.S01.M02 quarantine |
| TEST-PS-083-09.T15 | unit | PS-083-10.R01, PS-083-10.R02, PS-083-10.R03 | upgrade allowlist v1 to v1 plus optional field; read older drafts | older mirror views still validate; rollback keeps v1 behavior |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No P1-P4 field, exact coordinate or home address appears in any draft (privacy suite on fixtures).
- A record whose owner has not opted in can never produce a draft.

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
