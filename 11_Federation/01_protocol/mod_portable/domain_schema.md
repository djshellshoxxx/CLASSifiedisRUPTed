# PS-083-01 — Domain schema: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-01.R01** The module owns no stored entity; it defines allowlist tables and draft value types keyed by envelope type string.
- **PS-083-01.R02** Allowed payload fields per type are listed in code and in the schema registry and each is annotated P0 by F10.S02.M02; a field without an annotation is not exportable.
- **PS-083-01.R03** Location is carried only as a geohash string of length ≤ 5 plus locationLevel L1 or L2, never coordinates.
- **PS-083-01.R04** The statement-type registry is static versioned data that names, for every registered envelope type, the signer role a receiving vault must verify before acting on the statement.

## Specification

**Note:** Pure mapping library; allowlists are static data versioned with the schema registry and nothing is persisted here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01, PS-083-09.R03 | random records with random extra fields and geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 |
| TEST-PS-083-09.T06 | unit | PS-083-01.R03, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T16 | unit | PS-083-01.R04, PS-083-02.R01 | roleFor for listing, acceptance and consent statement types with correct and wrong signers | correct signer accepted; wrong signer yields a rule that makes F11.S01.M02 quarantine |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
