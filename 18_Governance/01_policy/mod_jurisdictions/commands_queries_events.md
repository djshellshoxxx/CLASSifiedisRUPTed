# PS-145-04 — Commands, queries and events: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-04.R01** draft, release and retire are publisher commands in the publisher's vault; release and retire produce signed statements (classrup.governance.jurisdiction_profile/v1 and classrup.governance.jurisdiction_profile_retirement/v1) with relay destinations and syncState prepared.
- **PS-145-04.R02** receive and select are vault commands in every user's vault; select is a local preference that produces no statement but emits governance.jurisdiction_profile.activated with change selected or deselected so local consumers refresh.
- **PS-145-04.R03** resolve and get are queries used by F01.S01.M03 (publish and age gate), F10.S01.M02 (retention), F09.S01.M02 (cash limit), F16.S03.M02 (breach notice) and the UI; resolve accepts explicit profileRefs and returns the merged values with their sources.
- **PS-145-04.R04** Relays apply their operator's profile through the relay command relay_upload, which verifies the operator key and emits governance.jurisdiction_profile.activated relay-locally with scope relay, and serve it through relay_latest.
- **PS-145-04.R05** Profiles are referenced everywhere by ProfileRef (publisherId, code) with the version resolved at evaluation time, and every statement type is registered in the F11.S01.M01 registry (N2).
- **PS-145-04.R06** governance.jurisdiction_profile.activated distinguishes released, retired, selected, deselected, upgrade_pending and upgraded so consumers know when to refresh.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.jurisdiction_profile.draft` | governance.jurisdiction_profile.author | [vault-local, publisher] { profileId?, expectedRevision?, code, name, countryCodes, retentionOverrides?, minimumAge?, ageGate?, requiredNotices, restrictedCategoryIds, taxonomyRef?, cashLimit?, breachNotificationHours?, disclaimerKey } | { profileId, profileRef, revision, version, status: draft, governedChange: boolean } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR |  | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.release` | governance.jurisdiction_profile.release | [vault-local, publisher + statement classrup.governance.jurisdiction_profile/v1] { profileId, expectedRevision, proposalId?, relayIds[] } | { profileId, profileRef, version, status: active, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROFILE_PROPOSAL_REQUIRED, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.retire` | governance.jurisdiction_profile.release | [vault-local, publisher + statement classrup.governance.jurisdiction_profile_retirement/v1] { profileId, expectedRevision, relayIds[] } | { profileId, profileRef, status: retired, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.receive` | governance.jurisdiction_profile.apply | [vault-local, inbound statement or PendingApplyPort] { envelope, receipt?, provenance, ownerConfirmed?: boolean (only from the pending inbox Apply action) } | { profileId?, profileRef?, stored: boolean, pendingId?, pendingReason?: untrusted_publisher\|paused_publisher\|decision_unavailable (also used when verify fails, with GOVERNANCE_PROFILE_PROPOSAL_REQUIRED), selectionState?: current\|upgrade_pending } | VALIDATION_FAILED, GOVERNANCE_PROFILE_UNTRUSTED, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR, GOVERNANCE_PROFILE_PROPOSAL_REQUIRED, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.select` | governance.jurisdiction_profile.select | [vault-local] { profileRefs: ProfileRef[] (1..3), declaredAgeAtLeast?: int } | { selected: ProfileRef[], versions: int[], effectiveMinimumAge? } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_STATE, GOVERNANCE_PROFILE_UNTRUSTED | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.confirm_upgrade` | governance.jurisdiction_profile.select | [vault-local] { profileRef, version, accept: boolean } | { profileRef, versionInUse, looserFieldsApplied[] } | NOT_FOUND, CONFLICT_STATE | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |
| `governance.jurisdiction_profile.relay_upload` | governance.jurisdiction_profile.relay_publish | [relay command] { envelope } | { profileRef, version, relayReceipt: classrup.platform.relay_receipt/v1 } | VALIDATION_FAILED, FORBIDDEN, PAYLOAD_TOO_LARGE, RATE_LIMITED, CONFLICT_STATE, GOVERNANCE_PROFILE_BOUNDS, GOVERNANCE_PROFILE_PRIVACY_FLOOR, GOVERNANCE_PROFILE_PROPOSAL_REQUIRED | governance.jurisdiction_profile.activated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.jurisdiction_profile.get` | governance.jurisdiction_profile.read | { profileRef, version? } or { profileId } | { profile: JurisdictionProfile } | NOT_FOUND |
| `governance.jurisdiction_profile.list` | governance.jurisdiction_profile.read | { publisherId?, status?, cursor?, limit <= 50 } | { items: JurisdictionProfile[], nextCursor? } | VALIDATION_FAILED |
| `governance.jurisdiction_profile.resolve` | governance.jurisdiction_profile.read | { profileRefs?: ProfileRef[] (1..3, default: the vault selection, or the relay's hosting profile on a relay), regionCountry?, categoryId?, action?: publish\|offer\|giveaway } | { effective: { evidenceDays, standardPurgeDays, auditDays, minimumAge?, ageGateApplies: boolean, requiredNotices[], restricted: boolean, cashLimits: Money[], breachNotificationHours }, sources: [{ profileRef, version, field }], fallback: boolean (true when the generic profile was used) } | VALIDATION_FAILED |
| `governance.jurisdiction_profile.compare` | governance.jurisdiction_profile.read | { profileRef, fromVersion?, toVersion } | { fields: [{ field, from, to, direction: stricter\|looser\|unchanged }] } | NOT_FOUND |
| `governance.jurisdiction_profile.relay_latest` | governance.jurisdiction_profile.relay_read | [relay query] { code? } | { items: [{ envelope, receipt }] } of the relay's active profiles, served unchanged | NOT_FOUND, RATE_LIMITED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.jurisdiction_profile.activated` | P3 | { profileRef { publisherId, code }, profileId, version, change: released\|retired\|selected\|deselected\|upgrade_pending\|upgraded, status: active\|retired, scope: vault\|relay, statementCid? } — vault-local (EVT-8); selected, deselected and upgrade changes reveal the owner's choice and are P3; relay-local after relay_upload with scope relay |

### Events consumed

| Type | Effect |
|---|---|
| `governance.category.changed` | revalidate restricted category references of stored profiles; entries for retired categories follow mergedInto; ids that now resolve leave scope_unresolved |
| `governance.policy_proposal.decided` | for outcome approved, retry profile versions held with reason decision_unavailable that cite this proposal |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_PROFILE_BOUNDS | 422 | no | a retention, age, cash limit or breach-notification value is outside the allowed range |
| GOVERNANCE_PROFILE_PRIVACY_FLOOR | 422 | no | profile would weaken a privacy floor of CTR-PRV-001 |
| GOVERNANCE_PROFILE_PROPOSAL_REQUIRED | 412 | no | a governed change needs a verified approved policy decision for this publisher, code and content |
| GOVERNANCE_PROFILE_UNTRUSTED | 403 | no | publisher is not trusted for scope profiles, trust is paused or the signing key is not active |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2, registered in F11.S01.M01): classrup.governance.jurisdiction_profile/v1 and classrup.governance.jurisdiction_profile_retirement/v1 - audience public; signer role publisher (principal: author = payload.publisherId, ext.signerKey active per F07.S02.M01 key_status at first sight; revoked keys quarantined); maxAge none (versioned configuration). The bundled generic profile is accepted against the release-pinned project key. The vault acts only on statements its receiving path accepted. F07.S02.M01 and the F10.S01.M02, F10.S01.M03 and F10.S01.M04 port registries are not listed in depends_on because F10.S01.M02 depends on this module (FLG-2); they are injected at the composition root. This module registers apply for its statement types in the F18.S02.M01 PendingApplyPort.


### Example

```
publisher vault: dispatch("governance.jurisdiction_profile.release", { "profileId": "0192f3b4-...", "expectedRevision": 2, "proposalId": "0192f3b2-...", "relayIds": ["relay:berlin.example"] })
=> { "profileId": "0192f3b4-...", "profileRef": { "publisherId": "did:key:z6MkP...", "code": "eu_de" }, "version": 3, "status": "active", "statementCid": "sha256-Zm9v...", "syncState": "prepared" }
user vault: dispatch("governance.jurisdiction_profile.select", { "profileRefs": [{ "publisherId": "did:key:z6MkP...", "code": "eu_de" }], "declaredAgeAtLeast": 18 })
=> { "selected": [{ "publisherId": "did:key:z6MkP...", "code": "eu_de" }], "versions": [3], "effectiveMinimumAge": 16 }
query governance.jurisdiction_profile.resolve { "regionCountry": "DE", "action": "publish" }
=> { "effective": { "evidenceDays": 1825, "standardPurgeDays": 30, "auditDays": 365, "requiredNotices": [...], "restricted": false, "cashLimits": [{ "amountMinor": 100000, "currency": "EUR" }], "breachNotificationHours": 72, "ageGateApplies": false }, "sources": [...], "fallback": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T05 | integration | PS-145-03.R03, PS-145-04.R03, PS-145-02.R05 | table-driven: for every merge-table row select two overlapping profiles with differing values | each field merged in its table direction (max, min or union); sources reported per field; Compare labels match the table |
| TEST-PS-145-09.T06 | contract | PS-145-04.R01, PS-145-04.R02, PS-145-04.R05, PS-145-04.R06, PS-145-09.R02 | release, receive, select, deselect, retire | statements validate against schemas and F11.S01.M01 registry rows; activated events carry ProfileRef and the matching change value |
| TEST-PS-145-09.T08 | abuse | PS-145-05.R03, PS-145-04.R04 | anonymous relay_latest; relay_upload by the operator key and by another key; scan logs for age declaration | read served unchanged with receipt; operator upload applied as hosting profile with relay-local activated (scope relay); other key FORBIDDEN; no age data in logs |
| TEST-PS-145-09.T20 | contract | PS-145-04.R03, PS-145-04.R05 | consumer fixtures read resolve: F09.S01.M02 cash limit, F16.S03.M02 breach hours, F10.S01.M02 retention by ProfileRef, F15.S04.M03 code with underscore | each consumer gets cashLimits, breachNotificationHours and retention values in the documented shape; underscore code valid |
| TEST-PS-145-09.T22 | integration | PS-145-02.R04, PS-145-04.R03 | vault offline 45 days receives eu_de version 4 released 40 days ago; fresh vault receives version 3 whose decision is a year old and was anchored 2 days before its release receipt | both versions apply because asOf is the anchored release time (or the claimed release time labelled as a claim), never the receiving vault clock |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [domain_schema.md](domain_schema.md).
