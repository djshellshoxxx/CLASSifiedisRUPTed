# PS-145-01 — Domain schema: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-01.R01** A JurisdictionProfile has a code, a version, covered countries, bounded retention overrides, a minimum age, required notices and restricted category references.
- **PS-145-01.R02** Profiles are public signed configuration (P0); the user's selection is a P3 local preference that is never sent anywhere.
- **PS-145-01.R03** Profile bounds protect privacy floors: location precision, home address secrecy and evidence retention limits cannot be loosened by any profile.

## Specification

### JurisdictionProfile

Schema `classrup.governance.jurisdiction_profile/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — stable primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — signer and origin |
| code | string — [a-z0-9-]{2,32}, unique per publisher |
| version | int — monotonic per code |
| name | object — locale to display name, 1..60 code points |
| countryCodes | string[] — 0..30 ISO 3166-1 alpha-2 codes; empty means community-wide |
| retentionOverrides | object — evidenceDays 180..3650, standardPurgeDays 7..90, auditDays 90..730; absent keys use CTR-PRV-001 defaults |
| minimumAge? | int — 13..21, self-declared gate |
| requiredNotices | object[] — 0..20 items {noticeId, textKey, appliesTo: publish\|offer\|giveaway\|all, categoryIds?: uuidv7[]} |
| restrictedCategoryIds | uuidv7[] — 0..200 ids of F18.S01.M03 Category |
| disclaimerKey | string — i18n key stating this is configuration, not legal advice; required |
| status | enum — draft \| active \| retired |
| proposalId? | uuidv7 — ref F18.S02.M01 approved decision, required for activation of changes |
| effectiveFrom? | timestamp — RFC 3339 UTC, publisher claim |
| provenance | object — {originRelay?, receivedAt, verifiedAt, statementCid} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- retentionOverrides never fall outside the declared ranges and never contradict RET-LEGAL-HOLD precedence.
- No field can express a public location precision above L2 or the publication of home addresses.
- At most one active version per (publisherId, code); versions only increase.

### Storage DDL

```sql
CREATE TABLE governance_jurisdiction_profile (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, code TEXT NOT NULL, version INTEGER NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_jurisdiction_profile_active ON governance_jurisdiction_profile(tenant_id, publisher_id, code)
  WHERE status = 'active';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01, PS-145-02.R02 | draft a valid profile and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V09 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T03 | property | PS-145-01.R03, PS-145-02.R02 | random retention and location values | values outside bounds or above L2 never accepted |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
