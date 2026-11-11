# PS-095-05 — Authorization and capabilities: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-05.R01** Relay policy: only relay operators draft, publish and retire rules; moderators and members read published rules; the public read capability needs no session.
- **PS-095-05.R02** Vault policy: a vault stores a policy statement only if signed by the relay key it fetched it from and pins the statement it showed the user.
- **PS-095-05.R03** Policy reads are cacheable for 5 minutes and never reveal drafts.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.policyrule.draft | operator | relay role operator |
| moderation.policyrule.publish | operator | relay role operator; rule is a draft; change-type and notice-period rules satisfied |
| moderation.policyrule.retire | operator | relay role operator |
| moderation.policyrule.read_public | anonymous, member, moderator | published versions only |
| moderation.policyrule.check_citable | moderator, operator | in-process relay call by F12.S02.M01 and F12.S01.M03; not routable over HTTP |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T07 | abuse | PS-095-05.R01, PS-095-05.R02, PS-095-05.R03 | moderator publishes; forged statement signature; draft read by member; HTTP call to check_citable | FORBIDDEN; vault rejects; NOT_FOUND; no route |

## Dependencies

Module depends on: F18.S01.M02, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
