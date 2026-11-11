# PS-095-07 — Privacy, retention and abuse: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-07.R01** Rules and statements are P0 public data and contain no personal data; drafts are visible to operators only.
- **PS-095-07.R02** Published versions are retained under RET-EVIDENCE and never deleted while any action cites them.
- **PS-095-07.R03** Policy tampering is prevented by signatures, immutability and audit of every operator action.

## Specification

**Data classification**
- PolicyRule published versions: P0.
- Drafts: P1 relay-internal, operators only.

**Retention**
- Published and retired versions: RET-EVIDENCE (kept at least 2 years after the last action citing them).
- Discarded drafts: deleted after 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator rewrites rules retroactively to justify past actions | published versions are immutable and signed; actions store ruleId with version and statement CID |
| T02 | Surprise restrictive rules | 14-day notice for restrictive changes; change type checked by V08; changelog required; vault shows 'changed since you joined' |
| T03 | Forged policy statement served by an impostor relay | vault verifies the relay signature and the relay key from the F16.S02.M02 registry |
| T04 | Rule text used to smuggle active content | texts are plain text with inert links, length capped |
| T05 | Moderator cites a scheduled rule to bypass the notice period | check_citable allows only versions in force at the decision time |
| T06 | Operator labels a restrictive change non_restrictive to skip notice | V08 derives the class from allowed actions, severity and family |
| T07 | A forged, foreign or equivocated governance decision injects a rule | only relay-scope decisions that F18.S02.M01 relay_upload verified for this relay's operator are drafted (V11), digests are checked, conflicted outcomes discard drafts, and drafts never publish by themselves |

**Abuse controls**
- Operator publish rate limited to 20 rule versions per 24 h (F12.S03.M03 window_counter class policy.publish); all operator actions audit-logged (F16.S01.M01).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T09 | abuse | PS-095-07.R01, PS-095-07.R03 | attempt to modify a published row directly; 21 publishes in 24 h | rejected by schema trigger; 21st RATE_LIMITED |
| TEST-PS-095-09.T10 | integration | PS-095-07.R02 | purge sweep while an action cites a version; discarded draft with the clock advanced 31 days | cited version retained; draft deleted |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
