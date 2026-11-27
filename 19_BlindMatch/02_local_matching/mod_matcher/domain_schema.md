# PS-150-01 — Domain schema: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-01.R01** Own no persistent entity; consume authenticated public-candidate snapshots and owner-private criteria.
- **PS-150-01.R02** Return only ownerId, listingId, revision and cid references without criteria, private amounts, scores or negative reasons.
- **PS-150-01.R03** Revalidate closed metadata and projection identity bindings without claiming structural checks verify signatures.

## Specification

**Note:** Pure values and ephemeral controller state only, with no persistent schema.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T01 | unit | PS-150-01.R01, PS-150-01.R02, PS-150-01.R03 | Inspect result keys and malformed retained metadata/evidence bindings | Only public owner/listing/revision/CID references return; signature admission remains upstream |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
