# Barter file-exchange alpha

The PWA uses real Ed25519 signed statements, kernel transactions and IndexedDB.
No relay is configured. Downloading a file never means another participant
received it. Every participant must import the relevant files into their own
vault. Full live delivery, identity rotation, revision/counteroffer editing and
physical handover confirmation are not completed by this alpha UI.

## Local journey

1. Create or unlock a vault. Create a sale/giveaway listing with barter enabled,
   exact declared value and a coarse location cell. Publish its signed file.
2. Exchange and import the other participants' published listing files. For
   matching, listings need a declared value, matching currency and a compatible
   coarse region. They must remain available, unexpired and unconflicted.
3. In **Local barter coordination**, choose your own offered item and the peer
   item you want. Sign and download the want; distribute it together with its
   referenced listing files. Everyone imports all wants/listings needed for the
   proposed cycle. The specification requires a **15-minute want aging period**;
   the application does not backdate wants to bypass it.
4. Explicitly opt into unfamiliar signing identities and optionally enter
   blocked did:key identities. These choices apply to the current unlocked
   session and reset on lock. Signatures establish control of a key, not a
   person's real-world identity. Discover bounded cycles. Time/expansion/result
   truncation is shown; suggestions are not commitments.
5. **Propose this exact cycle** rechecks the current signed inputs, signs an
   immutable proposal and saves it. The UI's first revision sets a one-hour
   consent deadline followed by a one-day execution window. Share the proposal.
6. Each participant imports the proposal, reviews every giving/receiving leg,
   explicitly reserves their own item and distributes the signed reservation.
   The local hold is durable; if importing its coordination claim fails, its
   download remains available for retry and the UI exposes orphan-hold release.
7. **I consent to this exact proposal** uses a transactional command. Before
   signing it rechecks the current proposal revision, exact signed graph,
   explicit local matching policy and the matching local inventory hold.
   Signature, local admission and persistence occur in one kernel transaction.
   Distribute/import each participant's consent and reservation files.
8. Refresh revalidates durable evidence and local inventory. Commitment requires
   every party's matching signatures and a fresh local feasibility check. A
   missing hold, conflicting signed promise or expired state cannot silently
   remain a new successful commitment. Withdraw explicitly and share the signed
   withdrawal; the local transaction releases that subject's holds. This cannot
   reverse a physical handover.

The UI can download a proposal's individual signed evidence files again. Browser
settings may require permission for multiple downloads. There is no combined
unsigned evidence import and no simulated delivery confirmation.

## Recovery and limitations

Encrypted alpha backups include wants and coordination evidence. Restore
reverifies signatures and reconstructs cached coordination before mutation.
Previously committed restored coordination freezes for explicit review rather
than trusting its cached feasibility result. Local policy is deliberately not
restored as opt-in. The backup is not full CTR-IOX-001 export: media and kernel
delivery history are excluded; see `packages/vault/README.md`.

The alpha uses explicitly versioned `classrup.alpha.*` want, proposal, consent,
reservation, withdrawal and tombstone payloads. Listing publication chains are
per subject; full CTR-FED-001 author-global gap buffering and tombstone retention
are incomplete. The discovery boundary has bounded records and rejects invalid
or missing references instead of substituting guessed edges. Only one canonical
edge per ordered pair is selected by the current matching engine.

Automatic relay transport, proposal revision/counteroffer editor, manual
conflict adjudication, complete device recovery and execution/handover workflows
remain unfinished. Domain tests and typechecking are not browser journey proof;
consult the current verification ledger for tested engines and exact commands.
