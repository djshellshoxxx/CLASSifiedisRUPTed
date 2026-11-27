# PS-149-05 — Authorization and capabilities: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-05.R01** Bind storage, principal and current-session guard at composition; operation bodies cannot choose the owner.
- **PS-149-05.R02** Require literal enabled true for creation, revision and activation while retaining inspection, pause and erase cleanup.
- **PS-149-05.R03** Check the session before admission, inside the transaction and after asynchronous settlement; ended sessions receive no data.

## Specification

_None._

Owner-bound local library only; no command-bus capability or audit sink is registered. F19 private intent retention follows the RET-OWNER-LIVE exception in CTR-PRV-001.

Default deny. For declared command-bus capabilities, evaluation and audit follow [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T05 | unit | PS-149-05.R01, PS-149-05.R02, PS-149-05.R03 | Use disabled, foreign, ended and queued sessions; then pause or erase while disabled | Only literal true enables new work; current owner retains cleanup without stale result release |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
