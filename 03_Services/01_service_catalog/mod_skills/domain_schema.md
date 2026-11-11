# PS-029-01 — Domain schema: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-01.R01** A ServiceOffering stores provider, linked service listing, skill codes, rate type, rate Money, service area cell, provider time zone, remote flag, credentials, status and projection sequence with tenant and revision per CTR-ID-001.
- **PS-029-01.R02** Offerings are P3 records in the vault with fields classified through F10.S02.M02, and only the signed projection built through the F11.S01.M01 allowlist is P0; they are retained under RET-STANDARD, and credential evidence attachments are P2 and sent only inside an end-to-end encrypted quote thread.
- **PS-029-01.R03** Rate type and currency are immutable after first publication; changing either requires a new offering so historical quotes stay interpretable.

## Specification

### ServiceOffering

Schema `classrup.services.offering/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

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
| serviceAreaCell | string — geohash of length exactly 5 (L2), accepted by F06.S02.M01 assertPublicCell |
| remoteCapable | boolean — true if work needs no on-site visit |
| providerTimeZone? | string — IANA zone, copied from the F03.S01.M02 calendar at publish and on every published revision |
| credentials | Credential[] — 0..10 items {label ≤ 80, issuer ≤ 80, year? 1950..2100, evidenceAttachmentId? (P2, never in the projection), attestation fixed 'self'} |
| status | enum — draft \| published \| withdrawn |
| projectionCid? | string — sha256- cid of the latest signed public projection (CTR-ID-001 ID-3), exactly the cid returned by StatementPublisherPort.publish |
| projectionSeq | int — seq of the latest signed projection, 0 before first publish; the next projection uses seq+1 and prev = projectionCid |
| syncState | map — per destination relay {state: prepared \| transport_acknowledged \| peer_accepted \| refused, at, relayStatement?: the relay's stated reasons when it refused or removed the projection}; claims by the relay are evidence of its clock only |
| withdrawReason? | enum — provider \| listing_unavailable \| draft_expired |
| publishedAt? | timestamp — RFC 3339 UTC of the first publication |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- credentials[].attestation is always 'self'; no code path sets a verified value.
- A published offering has at least one skill, a registered currency and a service area cell of exactly 5 characters.
- A listingId is linked to at most one non-withdrawn offering.
- withdrawReason never names a suspension or policy takedown; relay refusals and removals live only in syncState.
- An offering withdrawn without publishedAt produced no outbound statement, no tombstone and no event.

### Storage DDL

```sql
-- IndexedDB object store services_offering mirrors this shape. The SQLite form is used only by tests and the in-memory adapter;
-- relays never store this record, they store only the signed P0 projection as an F11.S01.M02 FederatedRecord.
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
| TEST-PS-029-09.T01 | unit | PS-029-01.R01, PS-029-01.R03 | create offering with valid input then revise the currency after publish | stored with revision 1; currency change returns SERVICES_RATE_IMMUTABLE |
| TEST-PS-029-09.T16 | contract | PS-029-01.R02, PS-029-07.R01 | build the projection for an offering with evidence references and P3-only fields set; open the publish sheet | projection contains exactly the F11.S01.M01 allowlist fields; vault record classified P3; publish refused until the PRV-6 notice is acknowledged |
| TEST-PS-029-09.T18 | unit | PS-029-01.R02 | inspect the withdrawReason enum and every code path that sets it | only provider, listing_unavailable and draft_expired exist; no suspension or policy value |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F03.S01.M02, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
