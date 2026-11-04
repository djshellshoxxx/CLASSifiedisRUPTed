# PS-093-02 — Validation rules: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-02.R01** Capture input is validated strictly and the caller must hold the target with a verifiable author signature, except for a labelled reporter claim.
- **PS-093-02.R02** Size limits are enforced before any storage so evidence is never truncated.
- **PS-093-02.R03** Verification and read requests are validated against the accessor's purpose and case context.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | targetType is in the allowed list and targetId is a uuidv7 | VALIDATION_FAILED |
| V02 | the store holds the target envelope for targetCid and targetRevision | MODERATION_EVIDENCE_SOURCE_MISSING |
| V03 | canonical body is at most 262144 bytes and at most 5 media items of at most 2097152 bytes each | PAYLOAD_TOO_LARGE |
| V04 | the author signature over the envelope verifies against authorKey, or the capture is explicitly a labelled reporter claim | MODERATION_EVIDENCE_SIGNATURE_INVALID |
| V05 | relay read purpose case_review or appeal_review carries a caseId the moderator is assigned to | FORBIDDEN |
| V06 | snapshot integrity is not purged | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid |
| TEST-PS-093-09.T03 | unit | PS-093-02.R02, PS-093-02.R03 | each rule V02–V06 violated in turn | documented error code and no row stored; forged author signature refused |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
