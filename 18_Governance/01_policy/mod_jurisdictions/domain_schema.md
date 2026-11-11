# PS-145-01 — Domain schema: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-01.R01** A JurisdictionProfile has a code, a version, covered countries, bounded retention overrides, a minimum age with an age gate, required notices, restricted category references, an optional cash limit and a breach-notification period, and is identified across versions by ProfileRef (publisherId, code).
- **PS-145-01.R02** Profiles are public signed configuration (P0); the user's selection is a P3 local preference that is never sent anywhere.
- **PS-145-01.R03** Profile bounds protect privacy floors: location precision, home address secrecy and evidence retention limits cannot be loosened by any profile.
- **PS-145-01.R04** A bundled generic profile (publisher = the release-pinned project key, code generic) carries the CTR-PRV-001 defaults and is the fallback whenever nothing is selected or a reference is unknown.

## Specification

### JurisdictionProfile

Schema `classrup.governance.jurisdiction_profile/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key of this version |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — signer and origin |
| code | string — ^[a-z0-9_-]{2,40}$, unique per publisher; ProfileRef = (publisherId, code) is the stable reference used by every module |
| version | int — monotonic per ProfileRef |
| name | object — locale to display name, 1..60 code points |
| countryCodes | string[] — 0..30 ISO 3166-1 alpha-2 codes; empty means community-wide |
| retentionOverrides | object — evidenceDays 180..3650, standardPurgeDays 7..90, auditDays 90..730; absent keys use CTR-PRV-001 defaults |
| minimumAge? | int — 13..21, self-declared gate |
| ageGate? | object — { appliesTo: (publish\|offer\|giveaway\|all)[] 1..4, categoryIds?: uuidv7[] 0..50 }; required when minimumAge is set |
| requiredNotices | object[] — 0..20 items {noticeId, textKey, appliesTo: publish\|offer\|giveaway\|all, categoryIds?: uuidv7[]} |
| restrictedCategoryIds | uuidv7[] — 0..200 ids of F18.S01.M03 Category |
| taxonomyRef? | object — { publisherId, packVersion?, packCid? } taxonomy the category ids refer to |
| unresolvedCategoryIds | uuidv7[] — derived; ids that do not resolve in the declared taxonomy (scope_unresolved) |
| cashLimit? | Money — CTR-MNY-001 {amountMinor, currency}, positive |
| breachNotificationHours? | int — 24..720, default 72 |
| disclaimerKey | string — i18n key stating this is configuration, not legal advice; required |
| status | enum — draft \| active \| retired |
| proposalId? | uuidv7 — ref F18.S02.M01 approved decision, required when governed fields differ from the previous version or, for a new code, from the generic profile |
| decisionCid? | string — cid of the verified decision recorded for this version |
| effectiveFrom? | timestamp — RFC 3339 UTC, publisher claim |
| activatedAt? | timestamp — anchored release time: relay receipt of the statement, else the publisher's claimed release time marked as a claim |
| provenance | object — {originRelay?, receivedAt, verifiedAt, statementCid, bundled: boolean} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- retentionOverrides never fall outside the declared ranges and never contradict RET-LEGAL-HOLD precedence.
- No field can express a public location precision above L2 or the publication of home addresses.
- At most one active version per ProfileRef; versions only increase.
- A version whose governed fields differ from the previous verified version, or a new code that differs from the generic profile, has a decisionCid verified by F18.S02.M01, unless provenance.bundled is true.

**Note:** ProfileRef = { publisherId: did:key, code } is the one reference type for profiles: F18.S01.M02 rule scopes, the F01.S01.M03 publication record, F10.S01.M02 retention rows, F15.S04.M03 tenant configuration and F09/F16 consumers use it, and the version is resolved at evaluation time. A reference with code only (for example a tenant's 'generic') resolves to the pinned profiles publisher of F18.S02.M01, then to the bundled project publisher.
Local record ProfileSelection (P3, device only, never transmitted; part of the export section governance.profile_selection): profileRefs (1..3), versionInUse per ref, declaredAgeAtLeast?, upgradePending?: { profileRef, version, looserFields[] }.
The signed statement classrup.governance.jurisdiction_profile/v1 carries the profile fields plus decision?: { envelope, receipt } for the cited proposal (or its decisionCid fetchable through governance.policy_proposal.relay_get).


### Storage DDL

```sql
CREATE TABLE governance_jurisdiction_profile (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, code TEXT NOT NULL, version INTEGER NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_jurisdiction_profile_active ON governance_jurisdiction_profile(tenant_id, publisher_id, code)
  WHERE status = 'active';
CREATE UNIQUE INDEX governance_jurisdiction_profile_version ON governance_jurisdiction_profile(tenant_id, publisher_id, code, version);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01 | draft a valid profile with code eu_de, one with all new fields and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V13 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T03 | property | PS-145-01.R03 | random retention, cash limit, breach hours and location values | values outside bounds or above L2 never accepted |
| TEST-PS-145-09.T18 | integration | PS-145-01.R04 | resolve with nothing selected; resolve for a tenant code unknown to the vault | both return the bundled generic values (CTR-PRV-001 defaults) with fallback true |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [module SPEC](SPEC.md).
