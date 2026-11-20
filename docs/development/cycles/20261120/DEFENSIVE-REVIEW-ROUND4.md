# Independent defensive review: production backup registry, round 4

## Source and method

Reviewed PR #58 source commit `38ada90037d8176b0e0e319651b712cc396cad5d`,
tree `8502bd83d5393a7513ee0a939df63d5d3665068d`, against actual main
commit `137d88e36cc6b1611b062daa33cf84c3d29c86b3`, tree
`c2232f469560799d51fb6cacec2adfcc91a7897c`.

This independent lane performed a source-focused defensive review of the PR
diff and the related vault, backup codec, signed-publication, location and
transaction implementations. A read-only Python comparison of the old and new
registry bodies was executed. No product tests, vulnerability reproduction,
exploitation, network probes or remote mutations were performed by this lane.
The integration lane reported a passing typecheck separately; that report is
not an independently executed result from this reviewer. Product-test results
were still pending when this note was prepared.

## Conclusion

No blocking security regression was identified in the reviewed production
changes. No security-specific production repair is recommended for this
factoring change on the evidence inspected. This conclusion is limited to the
reviewed change and related source paths; it is not a whole-product security
qualification or a substitute for current-source functional and browser gates.

## Source evidence

### Registry and cryptographic behavior are preserved

The entry body of the former `const codecs = [...]` in `apps/pwa/src/main.ts`
is byte-identical to the entry body of `productionBackupCodecs` in
`apps/pwa/src/backup-codecs.ts`. The comparison preserves entry order,
validators, ownership checks, canonical-key functions and recovery normalizers.
Both `openVault` call sites in `main.ts` use the shared registry. Only these two
production files change in the reviewed PR diff. Identity, signature,
encryption and wire-format implementations are unchanged.

### Restore admission precedes writes

`packages/vault/src/vault.ts` checks that the destination has no identity,
decrypts and verifies the signed backup envelope, checks the declared principal
against its author, unlocks the protected identity, and requires that identity
to match the author. Record preflight completes before identity or domain rows
are staged. Preflight checks the record tenant, declared type membership,
metadata, duplicate keys and schema.

### Canonical keys and signed records retain their checks

The vault applies each available `recordId` function before normalization and
again after `restoreData` output is parsed. Production composition retains CID
keys for publications, compound keys for listing revisions and retained records,
and owner-DID keys for location settings.

Archive IDs are independently generated lifecycle IDs, not canonical aliases
for listing IDs. `packages/bazaar/src/listings/archive.ts` generates or reuses
an archive record ID while storing its listing ID separately. Recovery must
preserve that distinction.

`apps/pwa/src/publication-backup.ts` retains CID admission and
`validatePublicationRecord`. The underlying bazaar validator verifies signed
evidence and author/subject consistency for supported publication types. The
normal publication reader additionally checks the owning listing and expected
publication type before returning its envelope.

### Owner guards and recovery normalization are unchanged

Archive, listing, listing-history, reservation, local notification, want and
coordination owner checks remain in the production composition. Location restore
requires `ownerDid` to match the recovered principal. It deliberately clears the
local change-time window and removes `lastChangedAt`, preserving the existing
policy in `packages/discovery/src/geoprivacy/location/index.ts`. That policy is
explicitly a local recovery behavior, not a network security boundary.

### The new rollback scenario targets a transaction boundary

The vault stages the identity and all restored records in one transaction.
The added test wrapper throws on the second record restore after the first
restore succeeded. `packages/kernel/src/storage/storage.ts` rolls back thrown
transaction callbacks, and the memory driver uses its undo journal. The test
checks that the identity and both domain rows are absent, then retries on the
same still-open vault instance. These are source inspection conclusions about
the test design, not a claim that this reviewer executed the test.

## Qualification limits and follow-on acceptance

1. The mixed test loads the complete production registry but populates archive,
   publication and location records only. It does not demonstrate a nonempty
   round trip for every registered codec.
2. The interruption scenario uses the memory storage adapter. It does not
   establish encrypted IndexedDB commit-failure, browser interruption,
   power-loss or target-device recovery behavior.
3. The reviewed mixed test queries restored storage directly. Positive
   acceptance through normal listing/publication, archive and location domain
   readers after reopening remains useful additional coverage.
4. Legacy fixtures are generated by current v1 code configured with an older
   codec subset. They are not an archival historical backup corpus.
5. Record recovery excludes attachments, blobs, delivery state, leases,
   whole-database recovery and key rotation under the existing scope. This
   review does not expand that contract or qualify those workflows.
6. Current-source typecheck, domain, browser and CLI results belong to the
   integration lane and its linked evidence. Older successful runs do not
   qualify a changed tree. Test execution was pending when this note was written.

The observations above are coverage boundaries, not newly confirmed
vulnerabilities. Continue ordinary functional acceptance and source-specific
qualification before integration.

## Recovery documentation reconciliation

The current README, vault README, PWA backup copy, user guide and
`docs/development/BACKUP_SCOPE.md` consistently describe scoped record recovery,
preserved signing identity and excluded media/delivery/device recovery. No
contradiction in that current policy was identified. Older documents that say
codec sets must match exactly describe explicitly identified historical source;
their original evidence should remain intact rather than be rewritten as a
current failure.

Three documentation maintenance items were identified for the integration lane:

- `HANDOFF-ROUND2.md` calls the generated archive-only fixture a "valid historical"
  backup. Its source instead uses current v1 export with a former codec subset.
  A clarification should distinguish generated compatibility fixtures from an
  archival historical corpus without altering the original execution record.
- `docs/development/REMAINING_WORK.md` still describes the PR #57 shared-preflight
  slice as an unqualified candidate. Current qualification and the remaining
  PR #58 mixed-registry slice should be recorded separately in the next handoff;
  no older failed, cancelled or incomplete result should be relabeled.
- The coverage-contract link in `packages/vault/README.md` uses
  `../../../docs/development/BACKUP_SCOPE.md`, which resolves outside the
  repository and does not exist. From that README its correct relative target
  is `../../docs/development/BACKUP_SCOPE.md`, which was confirmed to exist.

These are wording, status and navigation corrections. They do not change the
backup policy or establish additional security findings. No files beyond this
review note were changed by this lane.
