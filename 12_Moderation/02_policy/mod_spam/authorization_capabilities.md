# PS-097-05 — Authorization and capabilities: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-05.R01** The evaluator is reachable only in-process through the query moderation.spam.evaluate, which is not routable over HTTP, so it has no member-facing capability.
- **PS-097-05.R02** Configuration changes to thresholds require the relay operator role and are written to the audit log of F16.S01.M01.
- **PS-097-05.R03** Results visible to a member are limited to their own folded items in their own vault.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.spam.evaluate | local principal, operator | in-process only: the unlocked local principal's vault for author_presign on its own key and vault_filter, or the relay index-intake hook for relay_intake; not routable over HTTP |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T07 | abuse | PS-097-05.R01, PS-097-05.R02, PS-097-05.R03 | HTTP request to moderation.spam.evaluate; author_presign for another key; non-operator changes thresholds; member reads another vault's folded items | no route; FORBIDDEN; FORBIDDEN; only own folded items |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
