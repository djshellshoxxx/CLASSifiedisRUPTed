# PS-094-05 — Authorization and capabilities: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-05.R01** Vault policy: only the unlocked local principal can file, withdraw and read its reports and manage advisory subscriptions; incoming receipts and outcomes are accepted only when signed by the relay key the report was addressed to.
- **PS-094-05.R02** Relay policy: a relay accepts report statements from any registered or signed-request key not blocked by its hosting policy, and only that relay's moderators can open sealed reports.
- **PS-094-05.R03** The reported party never receives report objects from the relay; relay queries return NOT_FOUND for non-moderators.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.report.file | local principal | vault unlocked; target held with verifiable author signature; reporter key is not the author key |
| moderation.report.withdraw | local principal | report.reporterKey = local principal |
| moderation.report.receive | relay access (signed request) | relay hosting policy not blocking the key; relay rate limits (F12.S03.M03) not exceeded |
| moderation.report.read_own | local principal | vault unlocked |
| moderation.report.read_as_relay_moderator | moderator | relay role moderator on this relay; reporter key visible only on an open case |
| moderation.advisorysubscription.set | local principal | vault unlocked; publisher key not revoked |
| moderation.advisorysubscription.read_own | local principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T07 | abuse | PS-094-05.R01, PS-094-05.R03, PS-094-07.R01, PS-094-09.R03 | outcome signed by a different key; non-moderator queries relay reports | outcome quarantined; NOT_FOUND and no reporter key in any response or event to the author |
| TEST-PS-094-09.T08 | abuse | PS-094-05.R02 | unsigned and malformed relay report requests; blocked key | rejected with FORBIDDEN; no case created |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
