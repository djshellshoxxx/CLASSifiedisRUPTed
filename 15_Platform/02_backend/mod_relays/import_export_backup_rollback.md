# PS-118-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R07, R08, R09), CTR-SCH-001 (R07, R08), CTR-PRV-001 (R06, R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-10.R01 | Relay configuration (peer list references, limits) exports as versioned JSON with digest. Queue contents are not exported. | MVP |
| PS-118-10.R02 | Queue backups are excluded from routine backups beyond 7 days, matching the queue TTL. | MVP |
| PS-118-10.R03 | Queue items restored from backup are re-validated (signature, expiry) before forwarding. | MVP |
| PS-118-10.R04 | Relay rollback to previous build completes in ≤ 10 min (ASSUMPTION). | MVP |

## Data / schema
Config export: `{ "schema_id": "relay.config", "schema_version": "1.0.0", "sha256": "…", "limits": {…}, "peer_refs": [] }`. Peer keys are never in exports (CTR-FED-001 R09 key metadata is owned by F11).

## Commands / queries / events
`relay.config.export` (ope_, read) and `relay.config.import` (ope_, dual control).

## States & transitions
Restore: RESTORED → REVALIDATING (signature and expiry on all QUEUED items) → SERVING. Items failing validation → REJECTED with `RELAY.RESTORE_INVALID`.

## Validation & errors
Digest mismatch → `RELAY.CONFIG_DIGEST_MISMATCH` (400). Unknown MAJOR → `SCH.UNKNOWN_VERSION`.

## Authorization
Export and import require `ope_` with `relay.administer`; dual control on import.

## Failure, idempotency, concurrency, offline
Restore never resurrects expired items: `expires_at` is authoritative. A restored item already acked by peer is re-sent; peer dedupes (CTR-FED-001 R05). Rollback leaves queue rows intact.

## Privacy, retention, abuse
Backups of queue rows contain ciphertext or opaque bytes only; restore re-applies revocation purges (PS-118-03) before forwarding.

## Observability & budgets
Restore drill each quarter; RTO ≤ 30 min (ASSUMPTION).

## Tests
- TEST-PS-118-10-01 (integration): export → import digest round trip.
- TEST-PS-118-10-02 (integration): restore of revoked peer's items purges, does not forward.
- TEST-PS-118-10-03 (e2e): rollback under synthetic federation load, zero lost acked enqueues.

## Acceptance criteria
1. Export contains no key material or queue bytes (schema scan).
2. Restore revalidation matches expiry and signature results on fixtures.
3. Restore drill passes RTO.

## Assumptions & open decisions
- ASSUMPTION: RTO and rollback timing.
- D07 PROVISIONAL (unapproved): 7-day backup exclusion matches queue TTL.
