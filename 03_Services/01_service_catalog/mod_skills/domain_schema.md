# PS-029-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-01.R01 | Two record types: `skill_taxonomy_entry` (operator-owned, versioned) and `listing_skill` (one taxonomy code attached to one service listing). | MVP |
| PS-029-01.R02 | Taxonomy holds ≤ 2,000 active entries per `taxonomy_version` (ASSUMPTION). `skill_code` matches `^[a-z0-9][a-z0-9-]{1,62}$`. | MVP |
| PS-029-01.R03 | A listing holds ≤ 20 `listing_skill` rows. `(listing_id, skill_code)` is unique among non-detached rows. | MVP |
| PS-029-01.R04 | `proficiency` is a closed enum: `self_declared_basic`, `self_declared_working`, `self_declared_expert`. No verified level exists in MVP. | MVP |
| PS-029-01.R05 | Certification references: ≤ 5 per row, each a SHA-256 digest of a self-supplied document. No field may carry a "verified" value. | Future |
| PS-029-01.R06 | Free-text label ≤ 64 Unicode scalar values, NFC-normalized. Unmapped labels persist as `pending_review` and are never public. | MVP |
| PS-029-01.R07 | Taxonomy entries are never hard-deleted while referenced. A deprecated code stays resolvable for ≥ 24 months (ASSUMPTION). | MVP |

## Data / schema
```
listing_skill {
  id: string        // prefix PENDING CTR-ID-001 registry (proposed lsk_), 30 chars
  listing_id: string        // F03 listing ID, opaque ref; owned by parent feature
  owner_acc_id: string      // acc_ ; PSEUDONYMOUS class per CTR-PRV-001
  skill_code: string | null // null while pending_review
  label_nfc: string | null  // ≤64 chars; pending_review only
  taxonomy_version: integer // ≥1
  proficiency: enum         // R04
  status: enum              // pending_review | active | detached
  claim_digests: sha256hex[] // ≤5, Future
  revision: integer ≥1      // CTR-EVT-001 R02
  created_at, updated_at: RFC 3339 UTC
}
```
Provenance: `source = provider_input | operator_mapping`. Schema registered per CTR-SCH-001 as `service_listing.skill`.

## Commands / queries / events
Owned by [commands_queries_events.md](commands_queries_events.md). Entity state is canonical here; events use CTR-EVT-001 envelope.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Rule codes in [validation_rules.md](validation_rules.md). Module error code prefix `SKILLS` (CTR-ERR-001 R02 pattern).

## Authorization
Owner-only writes on own listing; operator reads of `pending_review` labels only with `purpose` (CTR-CAP-001 R06). See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Per [failure_recovery_idempotency.md](failure_recovery_idempotency.md). Entity IDs follow CTR-ID-001 `ulid` class; no sequential keys.

## Privacy, retention, abuse
`listing_skill` for `active` rows is PUBLIC-linked to the listing. `pending_review` labels are PSEUDONYMOUS and purged after 30 days (ASSUMPTION; D07 PROVISIONAL). No location fields exist in this schema.

## Observability & budgets
Row counts per status; no label text in telemetry.

## Tests
- TEST-PS-029-01-01 unit: R02–R04 boundary values (20/21 rows, 64/65 chars).
- TEST-PS-029-01-02 property: `(listing_id, skill_code)` uniqueness under random insert/detach sequences.
- TEST-PS-029-01-03 contract: schema golden fixtures per CTR-SCH-001 R09.

## Acceptance criteria
1. Schema matches R01–R07 and passes CTR-PRV-001 R01 classification (no unclassified field).
2. No field stores a verified-status value.
3. Golden fixture set exists for schema version 1.0.0.

## Assumptions & open decisions
- ASSUMPTION: taxonomy cap 2,000; deprecation retention 24 months.
- D07 (retention) PROVISIONAL (Dxx default, unapproved): 30-day purge of pending labels.
- No payment or receipt checklist applies: module is non-monetary.
