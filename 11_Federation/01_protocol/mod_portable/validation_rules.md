# PS-083-02 — Validation rules: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-02.R01** Outbound mapping is default-deny, so a new local field is never exported until it is added to an allowlist and reviewed.
- **PS-083-02.R02** Inbound payload validation uses the same allowlist and rejects unknown fields instead of ignoring them.
- **PS-083-02.R03** Every rejection returns a stable code that the calling module surfaces without echoing field values.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope type is one of the registered portable types and version major is supported | UNSUPPORTED_SCHEMA_VERSION |
| V02 | source record has federation opt-in true for this record at draft time | FEDERATION_NOT_OPTED_IN |
| V03 | every outbound field is on the allowlist for the type and classified P0 | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V04 | location geohash length ≤ 5 and no latitude/longitude members present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V05 | media references are content hashes of metadata-stripped images; no image reports GPS tags | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V06 | inbound payload has no members outside the allowlist, serialized size ≤ 65536 bytes, strings ≤ 10000 code points | FEDERATION_PAYLOAD_INVALID |
| V07 | inbound payload does not exceed 65536 bytes | PAYLOAD_TOO_LARGE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01, PS-083-09.R03 | random records with random extra fields and geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 |
| TEST-PS-083-09.T03 | unit | PS-083-02.R01, PS-083-07.R02, PS-083-09.R02 | record with homeAddress, email, exact lat/lon, geohash 7 | export refused or truncated per V03/V04 and codes returned |
| TEST-PS-083-09.T04 | unit | PS-083-02.R03, PS-083-02.R01 | record with opt-in false, then opt-in revoked between preview and build | FEDERATION_NOT_OPTED_IN |
| TEST-PS-083-09.T05 | unit | PS-083-02.R02, PS-083-02.R03 | inbound payload with extra member, 65537 bytes, unknown type version | FEDERATION_PAYLOAD_INVALID, PAYLOAD_TOO_LARGE, UNSUPPORTED_SCHEMA_VERSION |
| TEST-PS-083-09.T06 | unit | PS-083-01.R03, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-02.R01 | roleFor for listing, acceptance and consent statement types with correct and wrong signers | correct signer accepted; wrong signer yields a rule that makes F11.S01.M02 quarantine |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
