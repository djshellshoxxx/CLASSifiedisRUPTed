# PS-132-05 — Authorization and capabilities: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-05.R01** Only relay operators and admins with host access can apply the read-only and federation switches, and every change is written to the audit log with the reason.
- **PS-132-05.R02** Documentation edits require two maintainer approvals like the threat register.
- **PS-132-05.R03** Users cannot trigger containment of a relay; they can only report issues through incident channels and revoke their own keys.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R01 | member invokes containment; admin toggles 11 times in an hour; single admin grants admin to self | FORBIDDEN or no route; 11th rate limited; SECURITY_APPROVAL_REQUIRED |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
