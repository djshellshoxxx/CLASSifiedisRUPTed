# PS-086-02 — Validation rules: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-02.R01** A conflict is opened only from verified envelopes, so unsigned or invalid statements can never freeze a trade.
- **PS-086-02.R02** Resolution input is validated against the candidate set and the caller's authority.
- **PS-086-02.R03** Each violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every candidate envelope has a verified signature by the same author (or by the roles named in a commitment) | FED_SIGNATURE_INVALID |
| V02 | candidates contain ≥ 2 distinct cids and ≤ 5 entries | VALIDATION_FAILED |
| V03 | resolve decision is keep with keptCid in candidates, drop_all, or superseded with a verified superseding envelope naming all candidate cids | FEDERATION_CONFLICT_INVALID_RESOLUTION |
| V04 | commitment conflicts reject decision origin_wins | FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| V05 | expectedRevision equals current revision | CONFLICT_REVISION |
| V06 | conflict is open when resolving | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R02, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T02 | unit | PS-086-02.R01, PS-086-02.R03 | detect with an unsigned or role-less candidate; with 1 candidate | FED_SIGNATURE_INVALID or VALIDATION_FAILED; nothing opened |
| TEST-PS-086-09.T11 | integration | PS-086-06.R01, PS-086-06.R02, PS-086-02.R02 | replay detect with same candidates; two concurrent resolves | same conflictId; one success and one CONFLICT_REVISION |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
