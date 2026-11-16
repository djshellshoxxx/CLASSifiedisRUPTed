# PS-145-04 — Commands, queries and events: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-04.R01** draft, release and retire are publisher commands in the publisher's vault; release and retire produce signed statements (classrup.governance.jurisdiction_profile/v1 and classrup.governance.jurisdiction_profile_retirement/v1).
- **PS-145-04.R02** receive and select are vault commands in every user's vault; select is a local preference and produces no statement.
- **PS-145-04.R03** resolve and get are queries used by F01.S01.M03 (publish), F10.S01.M02 (retention) and the UI.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.jurisdiction_profile.draft` | governance.jurisdiction_profile.author | [vault-local, publisher] { profileId?, expectedRevision?, code, name, countryCodes, retentionOverrides?, minimumAge?, requiredNotices, restrictedCategoryIds, disclaimerKey } | { profileId, revision, version, status: draft } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR |  | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.release` | governance.jurisdiction_profile.release | [vault-local, publisher + statement classrup.governance.jurisdiction_profile/v1] { profileId, expectedRevision, proposalId?, relayIds[] } | { profileId, version, status: active, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROFILE_PROPOSAL_REQUIRED, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.retire` | governance.jurisdiction_profile.release | [vault-local, publisher + statement classrup.governance.jurisdiction_profile_retirement/v1] { profileId, expectedRevision } | { profileId, status: retired } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.receive` | governance.jurisdiction_profile.apply | [vault-local, inbound statement] { envelope, provenance, trustPublisher?: boolean } | { profileId?, stored: boolean, pendingReason? } | VALIDATION_FAILED, GOVERNANCE_PROFILE_UNTRUSTED, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.select` | governance.jurisdiction_profile.select | [vault-local] { profileIds: uuidv7[] (1..3), declaredAgeAtLeast?: int } | { selected: uuidv7[], effectiveMinimumAge? } | VALIDATION_FAILED, NOT_FOUND, GOVERNANCE_PROFILE_UNTRUSTED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.jurisdiction_profile.get` | governance.jurisdiction_profile.read | { profileId } | { profile: JurisdictionProfile } | NOT_FOUND |
| `governance.jurisdiction_profile.list` | governance.jurisdiction_profile.read | { publisherId?, status?, cursor?, limit <= 50 } | { items: JurisdictionProfile[], nextCursor? } | VALIDATION_FAILED |
| `governance.jurisdiction_profile.resolve` | governance.jurisdiction_profile.read | { regionCountry?, categoryId?, action?: publish\|offer\|giveaway } | { effective: { evidenceDays, standardPurgeDays, auditDays, minimumAge?, requiredNotices[], restricted: boolean }, sources: [{ profileId, field }] } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.jurisdiction_profile.activated` | P0 | { profileId, publisherId, code, version, status: active\|retired, statementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `governance.category.changed` | revalidate restricted category references of stored profiles; entries for retired categories follow mergedInto |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_PROFILE_BOUNDS | 422 | no | a retention or age value is outside the allowed range |
| GOVERNANCE_PROFILE_PRIVACY_FLOOR | 422 | no | profile would weaken a privacy floor of CTR-PRV-001 |
| GOVERNANCE_PROFILE_PROPOSAL_REQUIRED | 412 | no | activation needs a verified approved policy decision |
| GOVERNANCE_PROFILE_UNTRUSTED | 403 | no | publisher is not trusted by this vault |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
publisher vault: dispatch("governance.jurisdiction_profile.release", { "profileId": "0192f3b4-...", "expectedRevision": 2, "proposalId": "0192f3b2-...", "relayIds": ["relay:berlin.example"] })
=> { "profileId": "0192f3b4-...", "version": 3, "status": "active", "statementCid": "sha256-Zm9v...", "syncState": "prepared" }
user vault: dispatch("governance.jurisdiction_profile.select", { "profileIds": ["0192f3b4-..."], "declaredAgeAtLeast": 18 })
=> { "selected": ["0192f3b4-..."], "effectiveMinimumAge": 16 }
query governance.jurisdiction_profile.resolve { regionCountry: "DE", action: "publish" } => effective notices and retention with sources.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T05 | integration | PS-145-03.R03, PS-145-04.R03 | select two overlapping profiles | stricter value wins per field; sources reported |
| TEST-PS-145-09.T06 | contract | PS-145-04.R01, PS-145-04.R02, PS-145-09.R02 | release, receive, select | statements validate and verify; activated event payload valid |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
