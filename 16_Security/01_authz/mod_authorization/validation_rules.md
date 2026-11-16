# PS-126-02 — Validation rules: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-02.R01** Role commands are validated strictly, including role vocabulary, expiry bounds and the two-person rule for admin.
- **PS-126-02.R02** authorize() inputs are validated structurally and any malformed input returns Deny without throwing.
- **PS-126-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | role is moderator, operator or admin and subjectKey is a well-formed did:key | VALIDATION_FAILED |
| V02 | moderator and operator assignments carry expiresAt within 365 days | VALIDATION_FAILED |
| V03 | granting admin when two or more admins exist carries approvedBy, a different active admin | SECURITY_APPROVAL_REQUIRED |
| V04 | grantor is an active admin and is not the subject | FORBIDDEN |
| V05 | revoking must leave at least one active admin | SECURITY_LAST_ADMIN |
| V06 | expectedRevision matches the assignment revision | CONFLICT_REVISION |
| V07 | audit query range spans at most 90 days per request | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T01 | unit | PS-126-01.R01, PS-126-01.R02, PS-126-01.R03, PS-126-02.R01 | assign moderator for 90 days | assignment stored, statement signed, expiry set |
| TEST-PS-126-09.T02 | unit | PS-126-02.R02, PS-126-02.R03 | each rule V02–V07 violated | documented error code and nothing stored |
| TEST-PS-126-09.T03 | property | PS-126-02.R02, PS-126-06.R01 | generated actors, capabilities, resources and malformed inputs | authorize never throws, is deterministic, and every unlisted combination denies |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
