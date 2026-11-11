# F18.S01.M03 Goods taxonomy (PS-144)

## Implemented
- Commands: `governance.category.create`, `update`, `move`, `set_status`, `release_pack`, `apply_pack` (all idempotent, `module: F18.S01.M03`).
- Queries: `governance.category.get`, `list_children`, `tree`, `resolve`.
- Event: `governance.category.changed` (P0). Error codes defined here: `GOVERNANCE_CATEGORY_TREE_INVALID`, `_PROPOSAL_REQUIRED`, `_PACK_UNTRUSTED`, `_PACK_STALE`.
- Statement handler for the inbound router: `goodsDefinitions(opts).statementHandlers['classrup.governance.taxonomy_pack/v1'](ctx, { envelope, provenance, trustPublisher? })`, runs inside a command transaction (same code as `apply_pack`).
- Adapter for bazaar: `readTaxonomyView(tx)` builds a snapshot (all publishers, active publisher marked); `categoryAllowedFrom(() => view)` returns `(categoryId) => boolean` (active category of the active publisher; fails closed without a view). The root refreshes the view on `governance.category.changed`.
- Helpers: `receivePack`, `discardExpiredPendingPacks(ctx)` (30-day pending timeout; also run inside every `apply_pack`), `resolveIn`, `pickName`, `seedTaxonomyEntries()` (unsigned seed data, 12 groups).

## Ports the composition root must supply (`GoodsOptions`)
- `localPublisherId(): string | undefined` did:key of the publisher key this vault holds (authoring and release are FORBIDDEN otherwise).
- `signPack(type, payload, version, previousCid): Promise<SignedEnvelope>` Ed25519 over JCS; never implemented here.
- `verifyPack(envelope): Promise<{ type, author, cid, payload }>` throws when the signature is invalid.
- `proposalApproved(proposalId, categoryId): boolean | Promise<boolean>` port to F18.S02.M01 (V06).

## Deviations and decisions
- Untrusted publisher: stored as `pending` and `apply_pack` returns `ok({ applied: false, pendingReason })` (spec edge case), not an error; `GOVERNANCE_CATEGORY_PACK_UNTRUSTED` is returned for signature/cid/signer mismatch. A second call with `trustPublisher: true` applies the pending pack.
- V06 on `apply_pack` returns `GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED` although the spec lists it only for authoring commands. The first pack from a publisher is the adoption baseline (no proposal check); later restricted-flag changes need `proposalId` on the pack entry, verified through the port.
- A full snapshot may not drop an id (retire with `mergedInto` instead): V09 made explicit; a retired category cannot change or revive (TREE_INVALID).
- Additive fields in v1: `proposalId`, `deprecatedAt` on categories; Category query outputs add `name` (locale-resolved).
- Active publisher = the first publisher applied; there is no spec'd command to switch it (open question). `get`/`resolve` work for any publisher's id.
- `resolve.restricted` is true when the resolved category or any ancestor is restricted.
- Retiring from `deprecated` needs 30 days (`CONFLICT_STATE` before); `active -> retired` is allowed directly as the machine table says. A retire with non-retired children is TREE_INVALID.
- Hardening beyond spec: at most 10 pending packs (`RATE_LIMITED`); relay actors cannot apply packs (`FORBIDDEN`).
- Staged working copy lives in `governance.category_staged` (publisher vault); `release_pack` also applies the release to the own mirror.
- Seed pack: 12 groups with 4 children (60 categories, not about 300), unsigned; signing it needs the project key and is outside this module.

## Test rows
Claimed: T01, T02, T03, T04, T05, T06, T08, T09, T10, T11. T02 asserts the untrusted-publisher case as pending (see above), the tampered case as `GOVERNANCE_CATEGORY_PACK_UNTRUSTED`.
Not covered: T07 (relay serve/upload: the spec has no named relay command, only capabilities `relay_read`/`relay_publish`), T12 (load, Moto G profile), T13 (traceability tool), T14 (export/import needs ExportSectionPort of F10/F16, not available), T15 (a11y, needs the PWA).
Not implemented: relay read/publish endpoints, export/import sections, deletion/retention ports (N6), metrics `classrup_governance_category_*`, "user can pin a publisher".

## Open questions
- How does a user choose the active publisher (no command in the spec)?
- Which module registers the bundled seed publisher as trusted at first start?

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 28 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
