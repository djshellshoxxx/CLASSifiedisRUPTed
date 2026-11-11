# CTR-IOX-001 — Export, import, backup and rollback

**Status:** APPROVED. **Owner:** F10.S01.M03 (mod_export) and F15.S03.M02 (mod_backups).

- **IOX-1** User export bundle `classrup-export/v1`: ZIP-free JSON Lines stream; first line manifest `{format, exportedAt, accountId, did, modules[], counts, sha256 per section}`; then one record per line `{schema, record}`; signed manifest (Ed25519 device key). Includes all P0–P3 data owned by the user; excludes other users' P2+ content except the user's own copies of shared messages/consents.
- **IOX-2** Import validates format, signature, schemas (current or previous major), ID collisions (skip identical, reject conflicting), and never imports another user's private data; dry-run report before commit.
- **IOX-3** Relay backup: SQLite online backup API every 6 h + WAL archiving; encrypted at rest (operator-supplied key, never in repo); 30 daily, 12 monthly kept; quarterly restore drill with checksum verification.
- **IOX-4** Rollback: application rollback by redeploying previous release (schema expand/contract keeps N-1 compatible); data rollback only via restore to new instance + event replay; never destructive in-place downgrade.
- **IOX-5** Module-level export sections are owned by the module that owns the record; F10.S01.M03 orchestrates.

## ADR-0016 amendment (local-first)
- **IOX-6** The user's vault export (IOX-1) is the primary backup. The PWA shows last-export age and warns after 30 days. Encrypted backups go only to a user-selected location; keys are never uploaded by default.
- **IOX-7** IOX-3 applies to relays, which hold only signed public projections, encrypted envelopes and relay-local operational data; losing a relay loses no user-owned private data.
