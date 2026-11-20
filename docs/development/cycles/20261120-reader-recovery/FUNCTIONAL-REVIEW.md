# Independent functional review of production recovery readers

## Source and conclusion

Reviewed local reader-acceptance commit
`a2912f9a51baa5ecbd7db2b913b553e05501aab0`, tree
`b99f9abed475a6feeb52f14911f5cdf69b027bf5`, against its exact PR #58 parent
`38ada90037d8176b0e0e319651b712cc396cad5d`.

No blocking fixture error or normal-workflow mismatch was identified by this
independent source review. The new test is a meaningful acceptance check for
the six populated record types it covers. This reviewer did not author the
test or change production code.

The review is static. At this document's checkpoint, execution of the reader
test and the integrated compiler gate is still owned by the integration lane;
neither result is inferred from this review. The read-only command
`git diff --check 38ada90037d8176b0e0e319651b712cc396cad5d..a2912f9a51baa5ecbd7db2b913b553e05501aab0`
completed with exit 0.

## Fixture and command-path assessment

The scenario builds its owner records through `createBus`, `bazaarDefinitions`,
`discoveryDefinitions` and `locationDefinitions`. It supplies the unlocked
vault's storage and signing identity, and binds authorization to the same
principal and tenant. Peer retention uses a separate real identity and a signed
listing admitted through the ordinary retention command. The owner lifecycle
is not manufactured with direct record writes.

`packages/bazaar/src/listings/index.ts` creates the first listing at revision 1.
Publishing records revision 2 and its first public history snapshot.
Unpublishing advances the listing to revision 3 without creating another
history snapshot. The title edit records revision 4 because a prior publication
exists; republishing records revision 5. Consequently the three history pages
must contain revisions **5, 4, 2** in descending number order. The test checks
the pagination boundaries and the compound `listingRevisionId` keys rather
than accepting an empty or arbitrary history.

The second listing follows create, publish and archive. Its archive lifecycle
record has a separately generated ID; the test requires that ID to differ from
the listing ID and uses it for ordinary archive queries and restoration.
`packages/bazaar/src/listings/archive.ts` restores the archived listing from
revision 3 to revision 4 while retaining its publication chain. The subsequent
publish advances the listing to revision 5 and the signed publication sequence
to 3, with the prior archive tombstone CID as `prev`. The test verifies all of
those distinctions with the restored signer.

## Reader and recovery assessment

The pre-export assertions establish nonempty expected data before comparison:
two owner listings, public and archived publication evidence, three history
records, archive evidence, one retained peer listing, and public/private
location projections. It then compares these ordinary readers after export,
after restore, and after closing and reopening the encrypted vault.

The owner publication reader checks the owning listing, stored CID, subject,
signature and publication type. The history reader checks ownership,
canonical compound keys and snapshot hashes. The archive readers use the
separate lifecycle ID. These calls make the acceptance stronger than merely
comparing restored storage rows.

`apps/pwa/src/retained-backup.ts` uses the same owner/listing compound key as
normal retention and validates the retained signed provenance. The fixture's
peer listing is available, unexpired and matches the text, region and barter
filters; therefore the asserted one-item search result and zero excluded count
follow the actual query policy.

`packages/discovery/src/geoprivacy/location/index.ts` deliberately resets the
local rolling-window state during recovery. Its normal `LocationView` omits
those counters and dates while preserving the setting ID, revision, selected
public precision and optional private cell. Equality of the normal projections
before and after restore is therefore consistent with the normalization policy;
the test is not accidentally requiring the internal counters to survive.

The private-note assertions distinguish owner detail from public history and
the sealed export. Deterministic signatures before and after recovery check
identity preservation. The final restore-and-republish command demonstrates a
usable continuation of recovered evidence, rather than display-only recovery.

## Limits and follow-on scope

- The full production codec registry is registered, but only listings, listing
  revisions, publications, archives, retained listings and location settings
  are populated in this scenario. Notification, reservation and barter
  coordination recovery are not established by this test.
- Storage is the production encrypted adapter over `fake-indexeddb`, with
  normal close/reopen. Native engines, on-device persistence, interrupted
  commits and crash recovery remain separate qualification.
- The scenario uses the owner's ordinary successful path. It is not an
  authorization-negative suite, full lifecycle state exploration or proof of
  every expiry/conflict boundary.
- The deterministic clock is held constant and the test continues the same
  deterministic ID generator. That is appropriate for this bounded fixture;
  it does not qualify copied-vault coordination or a device-clock migration.
- Attachments, delivery state, leases, key rotation and database-wide recovery
  remain outside the existing backup contract and this acceptance.
- The 30-second per-test limit is unchanged. Actual execution must establish
  whether the complete scenario finishes within that limit on the runner;
  source review is not a timing result.

Only this new review document was written in this lane. No tests, production
files, protocol, product limits or remote state were modified.
