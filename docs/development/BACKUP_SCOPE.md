# Alpha backup coverage and compatibility

The alpha backup is a signed, encrypted export of the current principal's
supported domain records and signing identity. It is not a database snapshot.
The existing `classrup.vault.alpha_backup/v1` wire format and cryptographic
parameters remain unchanged.

## Coverage contract

An unlocked session exposes `backupCoverage()` as a read-only, bounded inventory.
The inventory reports counts for populated record types, unsupported record
types, the registered codec types, and whether the record/type caps were exceeded.
It never returns record payloads, keys, indexes, other tenants' types, or identity
wrapper data. It remains subject to the session and transaction lifetime guards.

The inventory allows at most 256 supported types and 10,000 exported records.
An overflow sentinel distinguishes a truncated inventory from complete coverage.
These limits bound the returned inventory and accepted export, not the total
work required to count stored rows. Large-vault and device performance require
separate measurement.
The UI displays the inventory on explicit request and clears it on lock.
Inventory success alone does not mean an export will succeed: schema, signature,
canonical key, passphrase, encryption and envelope-size validation still apply.

Export checks the actual principal-owned record types in the same read transaction
that collects the records. Any unregistered type blocks export; it must not be
silently omitted. A previous UI coverage check is never used to authorize export.
Only the current codec set is exported. The identity is included separately.

Blobs/attachments, blob references, event outbox/inbox, idempotency, leases, dead
letters, sync delivery state and storage migration metadata remain excluded.
Their exclusion is explicit in the UI and API. Complete backup, key rotation,
whole-database rollback protection and interrupted migration recovery remain
separate milestones; this change does not claim those workflows.

## Restore compatibility

Export also runs the existing recovery preflight over detached copies of its
captured records. This checks owner authority, record metadata, schema, indexes,
canonical keys, normalization and validation before returning a backup. Original
exported data and signatures remain unchanged; recovery normalization changes
only the copy being checked. Restore uses the same preflight and commits its
normalized result. Session closure during asynchronous preflight aborts export.

Existing backups with a subset of the current codec set remain accepted. Unknown
types, duplicate or unsorted declared types, invalid signatures, mismatched
principals, invalid record schemas and canonical-key mismatches still fail before
any identity/domain data commits. Error messages must give a useful compatibility
diagnosis without disclosing record payloads. No restore changes signing identity
to work around a native-browser import failure.

## Storage port

`tx.records.listTypes(tenant, limit)` lists distinct populated record types and
their counts for exactly one tenant, ordered by UTF-8 bytes, returning at most
`limit` entries. Counting does not deserialize record payloads.
The public limit is an integer in 1–10,001. Memory, IndexedDB, encrypted IndexedDB
and SQLite share this contract. The method is read-only and expires with its
transaction, including a retained/destructured reference.

## Acceptance

### Production records and ordinary recovery readers

The shared PWA registry currently has 15 record codecs. Three executed local
scenarios populate their union through ordinary domain commands, then export,
restore, reopen and continue owner actions. The precise candidate source,
results and pending hosted gate are in the
[notification/barter qualification](cycles/20261120-next-recovery/QUALIFICATION.md).

| Record types | Populated scenario | Recovery acceptance |
|---|---|---|
| `bazaar.listing`, `bazaar.listing_revision`, `bazaar.publication`, `bazaar.archive_record` | Normal readers | Listing/detail, paginated history, publication and archive readers; restore archive and republish through the existing signature/CID chain |
| `discovery.retained_listing`, `discovery.location_setting` | Normal readers | Retained peer search and private/public location views |
| `notify.notification`, `notify.preference`, `notify.notification_seen`, `notify.notification_day`, `notify.notification_diag`, `notify.pref_counter` | Local notifications | Inbox pagination/filtering, preferences, counters, domain deduplication, collapse and continued read/preference actions |
| `mutiny.want`, `mutiny.coordination`, `bazaar.inventory_hold` | Signed barter; also includes four listing/retention types above | Real committed exchange recovers frozen for manual review; wants/evidence/identity persist, repeated normalization and refresh preserve review state, ordinary terminal refresh releases the domain hold |

Each scenario uses the full registry, but its backup contains only its populated
types: six, six and seven respectively. The union is 15, not 19 distinct types.
This is not a single all-type archive, every state of each codec, native-device
acceptance, or a whole database snapshot. A domain inventory hold is distinct
from the excluded infrastructure lease store. External notification delivery
and channel grants remain outside local notification record recovery.

### Coverage and compatibility boundaries

- An unsupported current-principal record blocks export, including when inserted
  after a successful coverage check. Another tenant's type never blocks export.
- Per-type/total record counts and overflow states are deterministic and bounded.
- A compatible old backup restores after additional codecs are registered.
- Unknown restore scope fails without initializing the destination.
- Encrypted IndexedDB reopen preserves the inventory and exposes no payloads.
- The PWA exposes coverage on request, explains excluded data, and clears private
  counts and passphrase on lock; fresh browser qualification is required.
