# PS-093-05 — Authorization and capabilities: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-05.R01** Vault policy: only the unlocked local principal captures, verifies, previews, approves disclosures and reads snapshots in its vault, and the author-signature check is part of capture.
- **PS-093-05.R02** Relay policy: relay moderators read relay-held snapshots only for an assigned case or appeal, operators read the access log, and content authors read snapshots of their own content tied to an appeal and a redacted access log.
- **PS-093-05.R03** Every read, verify, export and purge writes an access row and a refused read writes none.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.evidence.capture | local principal, moderator | vault unlocked, or relay moderator on an assigned case; target envelope held; author signature check applied |
| moderation.evidence.ingest_bundle | operator | in-process relay call from report and appeal intake; not routable over HTTP |
| moderation.evidence.verify | local principal, moderator, operator | any snapshot in the store the actor controls |
| moderation.evidence.disclose | local principal | vault unlocked; the local principal captured the snapshot; target is P2 |
| moderation.evidence.read_as_reviewer | moderator | relay: assigned to the case or appeal referencing the snapshot; vault: local principal; access row written |
| moderation.evidence.read_as_subject | member | snapshot.authorKey = actor and an appeal exists on that relay for the decision citing the snapshot; stays allowed while the key is suspended or restricted on the relay |
| moderation.evidence.read_access_log | operator, member | operator any snapshot on the relay; vault owner for own vault; authors only the redacted view for snapshots of their own content |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T07 | abuse | PS-093-05.R01, PS-093-05.R02, PS-093-07.R03, PS-093-09.R03 | member without case reads relay snapshot; unassigned moderator reads; assigned moderator reads | FORBIDDEN, FORBIDDEN, success with exactly one access row; refused reads write none |
| TEST-PS-093-09.T08 | abuse | PS-093-05.R02, PS-093-07.R05, PS-093-09.R03 | author reads access log of own snapshot and of another's; attempt to UPDATE or DELETE an access row | own shows purpose, role and time only, accessor redacted, reporter rows excluded; other NOT_FOUND; mutation aborts |
| TEST-PS-093-09.T15 | abuse | PS-093-05.R03, PS-093-07.R03 | verify, export and purge one snapshot each | exactly one access row per action with action verify, export and purge |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
