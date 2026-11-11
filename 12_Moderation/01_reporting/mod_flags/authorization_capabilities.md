# PS-094-05 — Authorization and capabilities: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-05.R01** Vault policy: only the unlocked local principal can file, withdraw and read its reports and manage advisory subscriptions; incoming receipt, link and outcome statements are accepted only when signed by the relay key the report was addressed to.
- **PS-094-05.R02** Relay policy: a relay accepts report statements from any registered or signed-request key not blocked by its hosting policy, and only that relay's moderators can open sealed report bodies.
- **PS-094-05.R03** The reported party never receives report objects from the relay; relay queries return NOT_FOUND for non-moderators.
- **PS-094-05.R04** Reporter keys are readable on the relay only by moderators working an open case and by the in-process ledger used for conflict-of-interest and report-abuse checks; they never appear in events, case records or statements to the subject.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.report.file | local principal | vault unlocked; target held with verifiable author signature or message reporter claim; reporter key is not the author key |
| moderation.report.withdraw | local principal | report.reporterKey = local principal |
| moderation.report.receive | relay access (signed request) | relay hosting policy not blocking the key; signed relayId is this relay; relay rate limits (F12.S03.M03) not exceeded |
| moderation.report.receive_relay_statement | local principal | vault unlocked; statement signed by the relay the report was addressed to |
| moderation.report.read_own | local principal | vault unlocked |
| moderation.report.read_as_relay_moderator | moderator | relay role moderator on this relay; reporter key visible only on an open case; body opening is access-logged |
| moderation.report.read_status_own | member | signed request by the reporterKey of the report on this relay |
| moderation.report.read_ledger | operator | in-process relay call by F12.S02.M01 and F12.S01.M03 conflict checks; not routable over HTTP |
| moderation.report.link_case | operator | in-process relay call by F12.S02.M01 case intake; receipt exists on this relay; not routable over HTTP |
| moderation.localhide.add | local principal | vault unlocked; the hidden author is not the local principal |
| moderation.localhide.remove | local principal | vault unlocked; the hide row belongs to this vault |
| moderation.localhide.read_own | local principal | vault unlocked |
| moderation.localhide.filter | local principal | in-process vault read by local views (F06.S01.M02, F06.S02.M03) for the unlocked local principal; not routable over HTTP and never available on a relay |
| moderation.advisorysubscription.set | local principal | vault unlocked; publisher key not revoked |
| moderation.advisorysubscription.sync | local principal | vault unlocked; subscription exists |
| moderation.advisorysubscription.read_own | local principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T07 | abuse | PS-094-05.R01, PS-094-05.R03, PS-094-05.R04, PS-094-09.R03 | outcome signed by a different key; non-moderator queries relay reports; subject reads its case, action and statement of reasons | outcome quarantined; NOT_FOUND; no reporter key in any response, event, case record or statement |
| TEST-PS-094-09.T08 | abuse | PS-094-05.R02 | unsigned and malformed relay report requests; blocked key | rejected with FORBIDDEN; no case created |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
