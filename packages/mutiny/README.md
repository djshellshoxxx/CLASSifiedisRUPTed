# LocalMutiny alpha primitives

This package implements a bounded directed-cycle engine, signed **exact-item** want admission, immutable proposal/consent coordination and kernel-backed local records. It is an alpha subset of F02, not completion of the canonical module contracts.

## Matching

`admitSignedGraph(listingStatements, wantStatements, options)` verifies every envelope with federation before reading its payload. Supply the complete locally retained statement set, including tombstones and conflicting revisions, rather than only visible search results. Verification cannot establish that an unknown later peer revision does not exist.

An alpha want explicitly names its author's offered listing CID and the requested listing CID. Both must be available, opt in to barter, use the same currency and share an L1 region. A cycle must use the exact offered CID declared by the incoming want. No wants are inferred from titles. Unknown counterparties are excluded unless the user explicitly enables them. The application supplies local blocks and locally established known-owner information.

Wants wait 15 minutes before admission; future, expired and more-than-30-day-old claims are excluded. Same L2 cells use distance bucket 0; other cells in the same L1 conservatively use bucket 4. This is not the full geographic distance/profile implementation. Newer listing revisions supersede older ones; any observed same-revision fork freezes admission independently of delivery order. Owner tombstones suppress revisions through their declared revision, while a newer explicit republication may be admitted.

`discoverCycles(edges, options)` accepts **already admitted** edges; it does not verify signatures. It enumerates simple directed cycles with the smallest giver first and deterministic neighbor order. It rejects more than 2,000 nodes or 20,000 edges; length defaults to 5 and is capped at 8. Expansion count is bounded by 100,000 and enumeration time by 250 ms. A second resource cap stops after 500 retained candidates, reported as `truncated: results`, bounding subsequent hashing. This can omit better or additional disjoint cycles; it is not an optimal packing algorithm. Output selection is greedy by participants, quantized relative value imbalance, distance, oldest want age and canonical hash. Money calculations use integer decimal strings and BigInt.

The graph hash includes the reference clock and matching parameters. Count/result truncation is reproducible for identical inputs; wall-clock truncation is machine-dependent. `durationMs` measures enumeration, not admission, hashing or UI rendering. No whole-run 250 ms or 32 MiB claim has been established. A Web Worker is required before claiming responsive matching at full caps on mobile.

## Signed alpha contracts

- `classrup.alpha.want/v1`: `{offeringListingCid, requestedListingCid, expiresAt}`.
- `classrup.alpha.proposal_revision/v1`: the exact normalized `ProposalSnapshot` returned by `prepareProposal`.
- `classrup.alpha.consent/v1`: `{subjectId, revisionHash, revisionNo}`.
- `classrup.alpha.reservation/v1`: Bazaar's single-item `{subjectId, revisionHash, giverId, itemId, expiresAt, holdId}`.
- `classrup.alpha.withdrawal/v1`: `{subjectId, revisionHash, revisionNo, reason: decline|dropout|cancel}`.

These deliberately do not claim wire compatibility with the full canonical schemas. Envelope timestamps and reservation expiries are canonical UTC ISO strings; proposal clock fields are integer milliseconds. Proposal digests bind every normalized term, participant, item reference and deadline. Only the coordinator can revise. A revision invalidates all prior consent and reservations; a divergent revision freezes coordination. A participant may consent only for themselves. Imported duplicate/reordered statements do not manufacture additional consent. Signed peer reservations remain claims, never global locks or guarantees of goods.

`evaluateCoordination` requires every participant's signed consent and reservation plus fresh feasibility for the same digest. The kernel wrapper additionally checks the actual own inventory hold in the same transaction for every commit transition. A lost local hold or expired reservation freezes an already committed exchange. Withdrawals and freezes are terminal; there is no silent participant substitution.

## Persistence and composition

`mutinyDefinitions` requires three explicit callbacks: transaction-scoped `hasLocalReservation`, authoritative `checkFeasibility`, and transaction-scoped `releaseLocalReservations`. It has no permissive default. The application must bind these to real inventory and verified retained projections. `recheckProposal` compares every proposed leg against current admission output. Ordinary commands are kernel-authorized and tenant-scoped; all mutations and events share its transaction and optimistic revisions.

Commands: `mutiny.want.retain`, `mutiny.coordination.ingest`, `mutiny.coordination.refresh`. Queries: `mutiny.want.list`, `mutiny.coordination.list`. Run refresh on unlock, return to the app and timer ticks before presenting current states: queries alone do not release expired holds. Coordination is limited to five active subjects, 100 retained subjects and 200 evidence envelopes per subject; wants are capped at 500. Retention UI/eviction is not yet implemented.

For encrypted backup codecs, **persist the return value** of `normalizeCoordinationRecord`. It verifies signed evidence and does not trust cached commit feasibility. Previously committed restored exchanges become frozen with `restore_requires_review`; they need explicit recovery/renegotiation, not automatic recommit. Live local restarts privately replay a previously established local commit against its signed evidence. `validateWantRecord` verifies stored wants on restore. These functions do not replace per-principal vault isolation.

## Remaining work

Full matching profiles and category wants, per-party tolerance and compensation, key-link trust panels, delegated-device rotation/revocation, canonical schemas/registry trace coverage, retained suggestion lifecycle, signed reservation release notices, handover/execution evidence and recovery resolution remain incomplete. Signed files exposing cycle composition must stay under explicit participant-controlled exchange; encrypted participant transport is not implemented here. No production readiness or full F02 acceptance claim is made.

## Reproducible search probe

Run `node packages/mutiny/benchmark.ts`. On this development workspace (Linux x64, Node 24.22.1), seed 42, 1,000 nodes / 5,000 edges, 100 runs: enumeration p95 19.27 ms and total matcher p95 46.11 ms. Every run exhausted the 100,000-expansion budget and correctly reported `expansions`; these are incomplete searches, not full graph solutions. Input hash: `kH-jkwCOzBUflsaqyt14kQqXI1GjYo6iHx0X8N36vOY`. This measures the working implementation before integration commit, not a browser, phone, reference relay or whole application throughput claim.
