# PS-085-10 — Import, export, backup and rollback: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-10.R01** The library stores nothing, so there is no export, import or backup of its own.
- **PS-085-10.R02** Envelopes created by any past release must keep verifying; the signed-bytes and cid definitions are frozen for envelope v=1.
- **PS-085-10.R03** A change to canonicalization or hashing requires a new envelope version number and never alters v=1 behavior.

## Specification

- **export:** Nothing is exported; the module has no data. Golden vectors are exported as test fixtures only.
- **import:** Nothing is imported; golden envelopes are loaded from test fixtures only.
- **backup:** None; the relay signing key backup is handled by F16.S02 secrets management.
- **migration rollback:** Library version pin canonicalize 5.1.0; upgrading requires passing the RFC 8785 vectors and the golden-envelope suite; rollback is a dependency pin revert with no data migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T14 | unit | PS-085-10.R01, PS-085-10.R02, PS-085-10.R03 | verify golden envelopes created by the previous release; feed a v=2 envelope | all v=1 envelopes verify Ok after upgrade; v=2 is refused until a new version is defined; downgrade test passes |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
