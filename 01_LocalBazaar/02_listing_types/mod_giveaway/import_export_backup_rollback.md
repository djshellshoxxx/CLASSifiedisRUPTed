# PS-005-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 R06, R11, R12 (export, deletion record); CTR-FED-001 (listing federation; claims excluded); CTR-SCH-001 R07–R09 (migrations); CTR-EVT-001 R13.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-10.R01 | Claimant export includes own claims at PRIVATE_PERSONAL; giver counterpart fields are redacted to `redacted`. | MVP |
| PS-005-10.R02 | Giver export includes own giveaway listings (via F01) and claim counts only, no claimant identities. | MVP |
| PS-005-10.R03 | Claim records are never federated or published. Only the giveaway listing federates, per F01 and CTR-FED-001. | MVP |
| PS-005-10.R04 | Backups expire on schedule; restore replays purges (CTR-PRV-001 R06, BT-04). | MVP |
| PS-005-10.R05 | Schema changes are additive within 1.x; migrations pure and idempotent (CTR-SCH-001 R07). | MVP |
| PS-005-10.R06 | Rollback via feature flag: disable submit; open claims move to REJECTED or WITHDRAWN with `FEATURE_DISABLED`; no data deleted. | MVP |
| PS-005-10.R07 | Imported giveaway listings from peers carry signatures and are validated against PS-005-02 (no consideration fields). | Future |

## Data / schema
Export package: JSON per claim `{claim_id, listing_id, state, reason_code, timestamps, pickup_region, role}`. No content beyond PS-005-01 fields. Deletion produces an `aud_` completion record with counts only (CTR-PRV-001 R12).

## Commands / queries / events
Export is a `giveaway_claim.export` capability call; see [authorization_capabilities](authorization_capabilities.md).

## States & transitions
Rollback transitions defined in [workflow_state_machine](workflow_state_machine.md) (feature disabled row).

## Validation & errors
Import validation: `GIVE.CONSIDERATION_NOT_ALLOWED` for peer listings with price fields. Unknown MAJOR → `SCH.UNKNOWN_VERSION`.

## Authorization
Export requires self scope; giver listing export delegated to F01 capability.

## Failure, idempotency, concurrency, offline
Export is resumable with cursor; re-run produces identical package for same revision.

## Privacy, retention, abuse
Exports are PRIVATE_PERSONAL and encrypted in transit (ASSUMPTION). Retention per D07 (PROVISIONAL, unapproved), see [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & performance
Export of 10 000 claims ≤ 60 s p95 (ASSUMPTION). Backup restore drill monthly (ASSUMPTION).

## Tests
- TEST-PS-005-10-01: export contains no counterparty identity for giver-side export.
- TEST-PS-005-10-02: restore from backup replays purge; purged claim not reappearing.
- TEST-PS-005-10-03: feature-flag rollback leaves no open claim and no deleted record.

## Acceptance criteria
1. Export packages pass redaction fixtures.
2. Claim records never appear in federation payloads (CTR-FED-001 scan).
3. Rollback drill completes with zero data loss and zero open claims.

**Assumptions and open decisions:** Export format and throughput budgets are ASSUMPTION. D10 (PROVISIONAL default: user-controlled keys with documented recovery, unapproved) governs portability keys. D01 (PROVISIONAL default: versioned signed envelopes with explicit opt-in, unapproved) governs federated listing import. D07 applies to retention. See [DECISIONS.md](../../../DECISIONS.md).
