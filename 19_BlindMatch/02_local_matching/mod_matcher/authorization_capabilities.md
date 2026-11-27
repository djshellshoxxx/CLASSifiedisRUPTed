# PS-150-05 — Authorization and capabilities: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-05.R01** Default matching to disabled and enable only for configuration that is literal true.
- **PS-150-05.R02** Use the owning discovery adapter after signature admission, never another domain private tables or a verified boolean.
- **PS-150-05.R03** Exclude blocked, own, conflicted, withdrawn, unavailable and expired records without implying disclosure or trade consent.

## Specification

_None._

Owner-bound local library only; no command-bus capability or audit sink is registered. F19 private intent retention follows the RET-OWNER-LIVE exception in CTR-PRV-001.

Default deny. For declared command-bus capabilities, evaluation and audit follow [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T05 | unit | PS-150-05.R01, PS-150-05.R02, PS-150-05.R03 | Use default/malformed enablement and own/blocked/unavailable public records | Matching requires literal true and excludes ineligible records without consent inference |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
