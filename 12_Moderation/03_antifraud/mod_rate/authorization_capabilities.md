# PS-099-05 — Authorization and capabilities: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-05.R01** Relay policy: only relay operators change policy and reset buckets; any caller can read the status of their own bucket.
- **PS-099-05.R02** Vault policy: only the local principal changes local UX throttles, and local throttles never apply to or report on other parties.
- **PS-099-05.R03** The consume port runs for every request including anonymous ones, keyed by IP prefix only for anonymous requests.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.ratepolicy.set | operator, local principal | relay role operator, or vault unlocked for scope local |
| moderation.ratebucket.reset | operator | relay role operator; audit entry written |
| moderation.ratepolicy.read | operator, local principal | relay role operator, or vault unlocked |
| moderation.ratebucket.read_own | member, anonymous | caller's own key hash or IP prefix hash only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T07 | abuse | PS-099-05.R01, PS-099-05.R02, PS-099-05.R03 | member sets policy; reset by member; anonymous consume | FORBIDDEN, FORBIDDEN, keyed by IP prefix only |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
