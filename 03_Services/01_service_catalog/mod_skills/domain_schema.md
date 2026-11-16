# PS-029-01 — Domain schema: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-01.R01** A ServiceOffering stores provider, linked service listing, skill codes, rate type, rate Money, service area cell, remote flag, credentials and status with tenant and revision per CTR-ID-001.
- **PS-029-01.R02** Offerings are P3 drafts in the vault and become a P0 signed projection once published; they are retained under RET-STANDARD, and credential evidence attachments are P2 and sent only inside an end-to-end encrypted quote thread.
- **PS-029-01.R03** Rate type and currency are immutable after first publication; changing either requires a new offering so historical quotes stay interpretable.

## Specification

### ServiceOffering

Schema `classrup.services.offering/v1` · storage **device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| providerId | actorId — owner of the offering |
| listingId | uuidv7 — ref F01.S01.M01 Listing of subtype service; unique per offering |
| skillCodes | string[] — 1..10 codes from F18.S01.M03 taxonomy subtree services |
| rateType | enum — hourly \| fixed |
| rate | Money — CTR-MNY-001; > 0; ≤ 1 000 000 000 000 minor units; for fixed it is the starting price |
| minBillableMinutes? | int — 15..480; hourly only; default 60 |
| serviceAreaCell | string — geohash of length 4 or 5 (L1 or L2); never longer |
| remoteCapable | boolean — true if work needs no on-site visit |
| providerTimeZone | string — IANA zone, copied from the F03.S01.M02 calendar at publish |
| credentials | Credential[] — 0..10 items {label ≤ 80, issuer ≤ 80, year? 1950..2100, evidenceAttachmentId?, attestation fixed 'self'} |
| status | enum — draft \| published \| withdrawn |
| projectionCid? | string — sha256- cid of the signed public projection (CTR-ID-001 ID-3) |
| syncState | map — per destination relay {state: prepared \| transport_acknowledged \| peer_accepted \| refused, at: timestamp}; claims by the relay are evidence of its clock only |
| withdrawReason? | enum — provider \| listing_unavailable \| provider_suspended \| policy |
| publishedAt? | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- credentials[].attestation is always 'self'; no code path sets a verified value.
- A published offering has at least one skill, a registered currency and a service area of precision L1 or L2.
- A listingId is linked to at most one non-withdrawn offering.

### Storage DDL

```sql
-- IndexedDB object store services_offering mirrors this shape; the SQLite form is used by the optional relay mirror and tests.
CREATE TABLE services_offering (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, provider_id TEXT NOT NULL, listing_id TEXT NOT NULL,
  rate_type TEXT NOT NULL, rate_minor TEXT NOT NULL, currency TEXT NOT NULL, area_cell TEXT NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX services_offering_listing ON services_offering(tenant_id, listing_id) WHERE status <> 'withdrawn';
CREATE INDEX services_offering_provider ON services_offering(tenant_id, provider_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T01 | unit | PS-029-01.R01, PS-029-01.R03, PS-029-02.R01 | create offering with valid input then revise the currency after publish | stored with revision 1; currency change returns SERVICES_RATE_IMMUTABLE |
| TEST-PS-029-09.T14 | e2e | PS-029-01.R02, PS-029-03.R02, PS-029-09.R03 | mobile provider creates and publishes an offering and a client views it | credentials show self-attested; screen passes axe with zero serious issues |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
