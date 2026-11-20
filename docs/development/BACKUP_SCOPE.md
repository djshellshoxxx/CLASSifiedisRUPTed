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

The record inventory allows at most 256 supported types and 10,000 exported
records.
An overflow sentinel distinguishes a truncated inventory from complete coverage.
These limits bound the returned inventory and accepted export, not the total
work required to count stored rows. Large-vault and device performance require
separate measurement.

The PWA's explicit **Check backup coverage** action requests this record inventory
and the attachment diagnostic described below. These are successive session-guarded
snapshots, not one atomic inventory. It clears the previous report before reading,
displays both after completion and clears private counts on lock. The diagnostics
do not authorize export or expand its contents.
Record inventory success alone does not mean an export will succeed: schema,
signature, canonical key, passphrase, encryption and envelope-size validation
still apply.

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

The shared PWA registry currently has 15 record codecs. The original three
executed local scenarios populated their union through ordinary domain commands,
then exported, restored, reopened and continued owner actions. Their exact
candidate source, results and pending hosted gate are in the
[notification/barter qualification](cycles/20261120-next-recovery/QUALIFICATION.md).

| Record types | Populated scenario | Recovery acceptance |
|---|---|---|
| `bazaar.listing`, `bazaar.listing_revision`, `bazaar.publication`, `bazaar.archive_record` | Normal readers | Listing/detail, paginated history, publication and archive readers; restore archive and republish through the existing signature/CID chain |
| `discovery.retained_listing`, `discovery.location_setting` | Normal readers | Retained peer search and private/public location views |
| `notify.notification`, `notify.preference`, `notify.notification_seen`, `notify.notification_day`, `notify.notification_diag`, `notify.pref_counter` | Local notifications | Inbox pagination/filtering, preferences, counters, domain deduplication, collapse and continued read/preference actions |
| `mutiny.want`, `mutiny.coordination`, `bazaar.inventory_hold` | Signed barter; also includes four listing/retention types above | Real committed exchange recovers frozen for manual review; wants/evidence/identity persist, repeated normalization and refresh preserve review state, ordinary terminal refresh releases the domain hold |

Those original scenarios used the full registry with six, six and seven
populated types respectively. Their union was 15, not 19 distinct types, at
the source identified in that qualification.

The later [full-registry interaction acceptance](cycles/20261120-full-registry-recovery/QUALIFICATION.md)
expands the genuine barter lifecycle to populate **all 15 types in one owner
archive**. A separate archived listing and coarse location coexist with the
committed cycle. Accepted peer coordination evidence drives the actual local
notification subscriber; a normal preference edit supplies the remaining
preference/counter records. No direct inbox fixture or raw record insertion
creates this combined state.

Complete record snapshots and ordinary readers survive encrypted restore and
reopen with the two explicit normalization exceptions: coordination requires
fresh review, and the location import resets its local change window. Delivered
notification records, source IDs, preferences and counters remain unchanged.
Two subsequent coordination refreshes release the local hold without adding or
collapsing alerts; the production delivery-health helper reports completion.
Recovered mark-read and archive restore/republish actions continue normally.
Full TypeScript and nine selected production recovery cases passed at that
source. PR #63 subsequently merged as
`449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; its actual main-push Alpha and CLI
workflows passed, including 78 product browser journeys in the inspected Alpha
log. The [later consolidation record](cycles/20261120-recovery-consolidation/HANDOFF.md)
separates that main qualification from subsequent candidate results.

This acceptance does not cover every state of each codec, native-device
recovery or a whole database snapshot. A domain inventory hold is distinct
from the excluded infrastructure lease store. Kernel delivery state is not
restored; notifications are delivered before export. External notification
delivery and channel grants remain outside local notification record recovery.

### Attachment holder diagnostic

The current candidate adds `UnlockedVault.attachmentCoverage()` as a read-only,
principal-scoped diagnostic. It reports distinct held references, distinct
missing blobs, distinct present-but-excluded references, and holder-row counts.
Several holder rows can name one reference. A missing reference has no stored
blob; a present reference still does not qualify its blob for v1 backup.
Stored blobs with no holders are outside these counts, so zero counts do not
certify completeness. Holder strings are caller-supplied labels, not authenticated
parent-record authority; the result always states `holderAuthorityVerified: false`
and `includedInV1Backup: false`.
It contains no tenant, holder label, content identifier, filename, MIME type,
sample payload or bytes. Session guards run before and after the read; locking
revokes the session.

The attachment diagnostic admits at most 10,000 owner holder rows, independently
of the record coverage bounds. Overflow makes every attachment count
unavailable (`null`) instead of returning partial totals. Memory and both
IndexedDB working sets use a tenant-to-holder-key index maintained through
ordinary writes, snapshot loading and rollback. The diagnostic checks indexed
cardinality first and examines at most the requested owner limit for admitted
results; it does not traverse foreign holder rows. SQLite uses its
tenant-prefixed limit-plus-one query.
This bounds the diagnostic's holder traversal, not encrypted-vault unlock,
complete snapshot loading, total stored index memory or target-device cost.

Coverage queries preserve bytes. Explicitly detaching the last holder retains
the existing deletion/shredding contract. Encrypted reopen reconstructs the
diagnostic from stored rows. Existing signed v1 export still excludes both
attachment bytes and references in the blob stores, and acceptance verifies that
the new restored destination contains no attachments. These are separately
exercised acceptance properties, not portable recovery.

The [source inventory](cycles/20261120-recovery-consolidation/ATTACHMENT-SOURCE-INVENTORY.md)
finds no current production domain attachment field or `RepoDef.blobs`
composition among the 15 production codecs. Kernel media ports and a count API
do not supply an owning domain, authenticated parent linkage, media admission,
a portable manifest or a product media workflow. Those remain subsequent
engineering contracts; no PWA completeness certificate consumes this report.

### Coverage and compatibility boundaries

- An unsupported current-principal record blocks export, including when inserted
  after a successful coverage check. Another tenant's type never blocks export.
- Per-type/total record counts and overflow states are deterministic and bounded.
- A compatible old backup restores after additional codecs are registered.
- Unknown restore scope fails without initializing the destination.
- Encrypted IndexedDB reopen preserves the inventory and exposes no payloads.
- The PWA exposes coverage on request, explains excluded data, and clears private
  counts and passphrase on lock; fresh browser qualification is required.
