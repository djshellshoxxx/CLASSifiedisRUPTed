# PS-149-09 — Contract and acceptance tests: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-09.R01** Assert owner isolation, revisions, expiry, cancellation and rollback independently rather than checking source presence.
- **PS-149-09.R02** Exercise encrypted-vault codecs and signed public fixtures, with native browser qualification recorded separately.
- **PS-149-09.R03** Report actual outcomes and remaining activation gates without treating mocks or documents as production readiness.

## Specification

See the module test table below (all processes).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T01 | integration | PS-149-01.R01, PS-149-01.R02, PS-149-01.R03 | Create an intent, inspect its detached owner-bound record and encrypted raw vault rows | Random ID binds the row key; criteria, owner and ID remain inside the encrypted record |
| TEST-PS-149-09.T02 | unit | PS-149-02.R01, PS-149-02.R02, PS-149-02.R03 | Try unknown authority fields, invalid times, 51 live intents and noncanonical or reversed amount bounds | Reject malformed or excessive input without partial writes or truncation |
| TEST-PS-149-09.T03 | unit | PS-149-03.R01, PS-149-03.R02, PS-149-03.R03 | Create, activate, edit, pause and erase with current and stale revisions | Edits become draft; erase removes the row and invalidates pending matching |
| TEST-PS-149-09.T04 | integration | PS-149-04.R01, PS-149-04.R02, PS-149-04.R03 | Inspect intent storage, outbox and errors after lifecycle operations | Only the current row exists; no bus event, idempotency record, input echo or deletion history |
| TEST-PS-149-09.T05 | unit | PS-149-05.R01, PS-149-05.R02, PS-149-05.R03 | Use disabled, foreign, ended and queued sessions; then pause or erase while disabled | Only literal true enables new work; current owner retains cleanup without stale result release |
| TEST-PS-149-09.T06 | unit | PS-149-06.R01, PS-149-06.R02, PS-149-06.R03 | Inject transaction failure and session loss during persistence | Rejected transactions roll back; post-commit session loss conceals results and requires state inspection |
| TEST-PS-149-09.T07 | integration | PS-149-07.R01, PS-149-07.R02, PS-149-07.R03 | Erase while matching is pending, reopen the vault and inspect storage/backup coverage | Intent is absent; no identifying deletion record is added; independent copies are outside scope |
| TEST-PS-149-09.T08 | contract | PS-149-08.R01, PS-149-08.R02, PS-149-08.R03 | Exercise bounded capacity and spy on network/logging APIs; separately qualify target devices | No truncation, network or logging; mobile resource acceptance remains a release gate |
| TEST-PS-149-09.T09 | contract | PS-149-09.R01, PS-149-09.R02, PS-149-09.R03 | Run focused and regression suites with independently recorded execution results | Report passing tests and unavailable browser/device evidence separately from declared contracts |
| TEST-PS-149-09.T10 | integration | PS-149-10.R01, PS-149-10.R02, PS-149-10.R03 | Export an active intent, restore an older archive, and import a legacy codec archive | Source stays active; restored content is draft; no automatic loader call; legacy archives remain valid |

## Acceptance criteria

- All process requirements have explicit test contracts; executed evidence is separately reported.
- Focused tests and existing regressions pass without weakening assertions or counting unavailable browser execution.
- UI, authenticated discovery composition, mobile acceptance and confidential protocol release remain gated.

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
