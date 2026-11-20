# Production recovery reader acceptance

## Source and ownership

This bounded continuation starts from PR #58 source
`38ada90037d8176b0e0e319651b712cc396cad5d` (tree
`8502bd83d5393a7513ee0a939df63d5d3665068d`), whose base is main
`137d88e36cc6b1611b062daa33cf84c3d29c86b3`. The local development branch is
`codex/classrup-readers-20261120`; the integration owner controls remote
publication and qualification. No production runtime, wire format, signature
scheme, codec policy, product cap or existing test limit changes in this slice.

## Why this acceptance is needed

The initial PR #58 mixed-record test checks archive, publication and location
records through storage APIs. Those checks do not establish that recovered
owner listing/history queries, publication downloads or retained peer searches
accept the restored data. They also do not establish that a recovered archive
can continue its existing publication chain through ordinary commands.

`tests/integration/production-recovery-readers.test.ts` addresses that gap. Its
records come from the actual command bus and domain handlers, with real signed
peer evidence and the exact `productionBackupCodecs` registry. It does not use
direct record writes to manufacture the owner lifecycle.

The scenario creates, publishes, unpublishes, edits and republishes one owner
listing. It creates, publishes and archives a second listing, retains a peer's
signed listing, and sets the owner's coarse location preference. Six populated
record types cross one encrypted backup boundary: listings, listing revisions,
publications, archive records, retained listings and location settings.
The generated archive record ID must differ from its listing ID; normal archive
lookup and restore use that separate archive ID before and after recovery.

Before export, after restore, and after close/reopen, normal readers must return
the same owner list/detail, signed publication/tombstone, three paginated history
revisions, direct revision lookup, archive list/detail, filtered peer search and
public/private location projections. The test also checks preserved private
notes, absence of those notes from public history and the sealed JSON, and an
unchanged deterministic signature from the restored identity.

Finally, the recovered owner restores the archived listing and republishes it.
The new signed statement must retain the original author and extend the restored
tombstone's CID at the next sequence number. Reading the new publication and
restored archive through normal queries must succeed.

## Qualification boundary

The author performed static inspection. Execution is coordinated serially by
the integration owner to avoid concurrent heavy suites. At this source-writing
checkpoint, the new test and typecheck have not yet been executed; no passing
result is claimed here. The integration owner's later evidence records the
actual command, source identity, outcome and any repair.

The test retains the existing integration-test limit of 30 seconds. It runs the
production encrypted storage adapter over `fake-indexeddb`; this is not browser
engine, device, disk-crash or operating-system interruption qualification. It
does not recover attachment blobs/references, delivery queues, leases or a whole
database, and it does not establish key rotation or copied-vault safety.

## Branch inventory at this source checkpoint

The 64 observed remote branch names, including main, partition as follows:

| Disposition | Count |
|---|---:|
| Non-main heads ancestral to main `137d88e3` | 39 |
| Non-ancestral contributions previously integrated by content | 6 |
| Superseded or adapted historical references | 12 |
| Preserved unfinished product/specification branches | 4 |
| Preserved native WebKit diagnostic branch | 1 |
| Active PR #58 source | 1 |
| Main | 1 |

All 57 original non-main heads in
`docs/development/evidence/20261118/inventory.json` are unchanged. No further
blind or drop-in runtime merge was established. PR #8 remains selective
reconciliation. A separate code worker is preparing a narrow adaptation of its
secret-field vocabulary; that work has independent ownership and qualification
and is not counted here as an integrated source branch. Previous preservation
decisions still apply. These are pinned discovery observations, not
authorization to delete branches or a claim that later heads cannot change.

## Next worker

Review this test independently, execute it with the existing focused recovery
tests and the repository typecheck, and inspect any normal-reader mismatch
before changing production code. Include this slice only in a candidate whose
actual current source passes its required CI gates. Keep PR #58's original
pending, cancelled or failed observations as historical evidence. After ordinary
integration, verify the actual merge tree and main's own push qualification.

Notification and barter coordination reader acceptance, actual IndexedDB
interruption handling, attachments, delivery/lease recovery, rotation and device
acceptance remain separate slices. Refresh remote heads and worker ownership
before starting one. No release, deployment or remote branch rewrite occurred
in this worker.
