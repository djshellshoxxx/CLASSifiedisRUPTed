# PS-012-10 — Import, export, backup and rollback: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-10.R01** Export contains all revisions of subjects the user is a party of, including peer revisions with provenance, because they are signed evidence.
- **PS-012-10.R02** Import verifies hash and signature of every revision, skips identical ones, rejects conflicting IDs and keeps forked flags.
- **PS-012-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.revisions in classrup-export/v1; one line per ProposalRevision (schema classrup.mutiny.proposal_revision/v1) including sig and provenance.
- **import:** Each line is verified (hash, signature, chain) and stored read-only; subjects with open status import as frozen until the user reopens them, so no stale consent is acted upon.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext envelopes in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; snapshot canonical form is part of the hash, so any change to canonicalization is a new schema major; rollback to the previous release leaves stored revisions readable.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T16 | integration | PS-012-10.R01, PS-012-10.R02, PS-012-10.R03 | export, import to fresh vault, rollback | revisions round-trip with signatures valid; conflicting IDs rejected; forked flag preserved |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
