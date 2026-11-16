# PS-054-05 — Authorization and capabilities: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-05.R01** Vault policy - only a person who knows the passphrase or holds the platform-protected key can unlock; once unlocked the principal acts as the local actor.
- **PS-054-05.R02** Relay policy - challenge and start are open to anonymous callers (they authenticate by signature); all other session commands need a valid relay token of the same DID.
- **PS-054-05.R03** Relay roles from security.role.* apply only to that relay's resources and end sessions so they take effect on the next request (CAP-6).

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.session.unlock | anonymous | local passphrase or platform key; local backoff applies |
| identity.session.lock | principal | vault unlocked |
| identity.login_challenge.issue | anonymous | relay policy allows the DID; rate limit 10 per minute per IP /24 |
| identity.session.start | anonymous | valid unexpired challenge and valid device signature |
| identity.session.rotate | principal | valid relay token of the DID |
| identity.session.revoke | principal | valid token or unlocked vault; sessions belong to the DID |
| identity.session.read_own | principal | unlocked vault or valid relay token; own DID only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T08 | abuse | PS-054-05.R01, PS-054-05.R02, PS-054-05.R03 | non-owner revokes another DID's session; unauthenticated rotate; role change on relay | NOT_FOUND or UNAUTHENTICATED; role change ends sessions |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
