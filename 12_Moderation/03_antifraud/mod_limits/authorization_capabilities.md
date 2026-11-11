# PS-098-05 — Authorization and capabilities: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-05.R01** Relay policy: moderators set and clear overrides within bounds and members read their own limits; the check capability is for the relay bus only.
- **PS-098-05.R02** Vault policy: not applicable beyond showing the relay's limit statement; the vault never enforces another party's limits.
- **PS-098-05.R03** A moderator cannot override limits on their own key, including any key linked to their principal.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.accountlimit.override | moderator, operator | relay role; subject principal is not the actor's principal; value and expiry bounded |
| moderation.accountlimit.clear_override | moderator, operator | relay role; override exists |
| moderation.accountlimit.submit_completion | member | signed request by a key that is a party to the completion; rate limited by F12.S03.M03 |
| moderation.accountlimit.check | operator | in-process relay bus call; not routable over HTTP |
| moderation.accountlimit.read_own | member | subjectKey = actor on this relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T08 | abuse | PS-098-05.R01, PS-098-05.R02, PS-098-05.R03 | member overrides own limit; member calls check over HTTP; moderator overrides a key linked to its own principal | FORBIDDEN, no route, FORBIDDEN |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
