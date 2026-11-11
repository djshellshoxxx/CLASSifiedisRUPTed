# PS-086-02 — Validation rules: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-02.R01** A conflict is opened only from verified envelopes, so unsigned or invalid statements can never freeze a trade.
- **PS-086-02.R02** Resolution input is validated against the candidate set and the caller's authority.
- **PS-086-02.R03** Each violation maps to one stable error code.
- **PS-086-02.R04** A commitment conflict accepts only drop_all, which releases the freeze locally and cancels the dependent coordination, or superseded by a renegotiated statement whose digest every required signer of the registry entry has signed; keeping one candidate is refused.
- **PS-086-02.R05** A relay operator may resolve only public_projection conflicts on that relay.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every candidate envelope has a verified signature (F11.S01.M03) and holds its registry role; fork candidates share one chain key and seq, commitment candidates share one subject key and conflict under the registry predicate | FED_SIGNATURE_INVALID |
| V02 | candidates contain ≥ 2 distinct cids and ≤ 5 entries | VALIDATION_FAILED |
| V03 | public_projection resolve decision is keep with keptCid in candidates, drop_all, or superseded with a verified envelope of higher seq naming all candidate cids in ext.supersedes | FEDERATION_CONFLICT_INVALID_RESOLUTION |
| V04 | statementClass commitment accepts only drop_all (local release of the freeze) or superseded with a renegotiated statement whose digest is signed by every required signer in the registry (all listed participants) | FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| V05 | expectedRevision equals current revision | CONFLICT_REVISION |
| V06 | conflict is open when resolving | CONFLICT_STATE |
| V07 | relay policy: an operator may resolve only statementClass public_projection | FORBIDDEN |
| V08 | at most 20 open conflicts per author per tenant; a further detection puts the author's later envelopes in author-level quarantine instead of opening a record | FEDERATION_CONFLICT_AUTHOR_LIMIT |
| V09 | is_frozen reads the local conflict store synchronously; when the store cannot be read callers receive this code and must refuse the action (fail closed) | DEPENDENCY_UNAVAILABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T01 | unit | PS-086-01.R01, PS-086-01.R03, PS-086-02.R02 | detect with E7a and E7b | one open ConflictRecord with 2 candidates, claimed and receipt times stored separately |
| TEST-PS-086-09.T02 | unit | PS-086-02.R01, PS-086-02.R03 | detect with an unsigned or role-less candidate; with 1 candidate | FED_SIGNATURE_INVALID or VALIDATION_FAILED; nothing opened |
| TEST-PS-086-09.T05 | integration | PS-086-03.R02, PS-086-02.R04 | commitment conflict C1 vs C2 for 30 days, then resolve keep C1 | still open after 30 days; freezeScope contains the proposal; keep returns FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE |
| TEST-PS-086-09.T11 | integration | PS-086-06.R01, PS-086-06.R02, PS-086-02.R02 | replay detect with same candidates; two concurrent resolves | same conflictId; one success and one CONFLICT_REVISION |
| TEST-PS-086-09.T13 | integration | PS-086-07.R02, PS-086-02.R05 | relay harness: operator calls resolve on a public conflict and on a commitment conflict id injected into the relay store; inspect relay storage | first succeeds with audit; second FORBIDDEN; relay holds no commitment record and no plaintext |
| TEST-PS-086-09.T18 | unit | PS-086-02.R04 | commitment conflict on D: supersede with a renegotiated statement signed only by S; then signed by S and T; separately drop_all | first FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE; second superseded; drop_all resolved and the freeze released locally only |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
