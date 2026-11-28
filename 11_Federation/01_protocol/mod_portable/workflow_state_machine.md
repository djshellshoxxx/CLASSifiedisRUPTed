# PS-083-03 — Workflow state machine: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-03.R01** The mapper is stateless and the draft/mirror conversion is a pure function of its inputs.
- **PS-083-03.R02** The only sequencing rule is that a draft must be signed and stored through the F11.S01.M02 publish path (StatementPublisherPort) before it is visible to any peer.
- **PS-083-03.R03** No lifecycle is stored here, so there is no state machine.

## Specification

**Note:** Stateless mapper; record lifecycle states belong to F11.S01.M02 (FederatedRecord) and the source modules.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T07 | contract | PS-083-03.R01, PS-083-03.R02, PS-083-04.R01, PS-083-04.R02 | exercise each exported function | signatures and Result shapes match the schema registry; error params contain no values; toMirrorView refuses envelopes that F11.S01.M02 has not stored |
| TEST-PS-083-09.T08 | unit | PS-083-03.R03, PS-083-04.R03, PS-083-05.R01 | inspect module for event emission, stored lifecycle state and authorization calls | none present |
| TEST-PS-083-09.T09 | integration | PS-083-03.R02, PS-083-05.R03, PS-083-09.R03 | draft then F11.S01.M02 publish then receive in a second vault then toMirrorView | mirror view equals source P0 fields, labelled remote, readable anonymously, no private fields |
| TEST-PS-083-09.T27 | unit | PS-083-03.R01, PS-083-05.R03 | toMirrorView of a verified listing (sell with variants, and giveaway) and of a rental offering | mirror exposes author, recordKey, version, listingRevision, expiresAt, inStock, variants, acceptedCurrencies, mailboxHints and giveaway closesAt, labelled remote and read-only; no member outside the allowlist |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
