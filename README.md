# CLASSifiedisRUPTed (ClassRup)

Local-first classifieds and cyclic barter, with user-held identities and optional relays. The browser vault is the product; a server account is not required.

**Development alpha, not a completed milestone or production release.** This branch adds real domain implementations and a browser composition on top of the Stage 3/4 kernel. Automated domain tests and builds are separate from browser acceptance; see the [current project status](docs/status/PROJECT_STATUS.md) for evidence and blockers.

## Run from a terminal

Requires Node >=22.18.0 and the pinned pnpm 10.28.0. See the [CLI setup guide](docs/CLI_SETUP.md) for Windows, macOS and Linux prerequisites, configuration, troubleshooting and static hosting.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git switch main   # canonical branch; see the execution report for current qualification
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

Use `pnpm run setup` and `pnpm run doctor`: both bare names collide with pnpm's own built-in commands. Setup preserves settings and browser data. `pnpm run configure --port 4180` explicitly changes non-secret settings. `pnpm build` creates `dist/`; `pnpm preview` serves it locally. Production static hosting requires HTTPS. No mandatory Docker, database server, relay or paid service.

## Implemented scope and limits

- Owner archive/recovery records with a 90-day local-clock restore window, signed withdrawals, encrypted-backup support and owner listing pagination. Owners can close listings with a reason and download their current verified signed file again. While unlocked, bounded maintenance expires publications and archives closed/expired listings after 30 days. Restore returns listings unpublished. Complete purge remains unfinished; legacy archives have no invented deadline.
- Owner-only local listing history with hashed public-field snapshots, publication-status labels, material-change markers, pagination and backup support. New history begins with this version; published editing and buyer reconfirmation remain unfinished.
- Ed25519 identities, encrypted signing-key storage, lock/unlock, per-vault IndexedDB persistence and signed/encrypted record backup into a new vault. Sessions default to a 15-minute idle lock (configurable 1–60) and lock after five minutes hidden. Local unlock backoff survives reopening within the same page; it is not an offline guessing defense.
- Single-item listing lifecycle, exact minor-unit values, signed public projections, explicit file exchange, retained peer verification and revision/fork checks.
- Browser editing for draft/unpublished listings, preserving exact values and private notes. An explicit **Remove declared value** control removes an optional value; ordinary edits keep it. Sale listings still require a value before publication. Saving an edit never publishes it; published items must be explicitly unpublished first. See [value editing](docs/LISTING_VALUE_EDITING.md).
- Bounded deterministic barter graph enumeration, independently checked against small-graph oracles; signed alpha proposal, consent and reservation state transitions with explicit consistency limits.
- Barter signature admission and matching run in a bounded background worker. Cancelling or locking terminates the worker and rejects stale results. The worker asset is included in the public offline cache; signing keys and vault storage remain outside it.
- Private coarse-area preferences, optional one-time device positioning reduced to a geohash tile, and explicit copying into a new listing or local search. Owner settings survive encrypted backup and reopening; precise sharing is not implemented.
- Local inbox for accepted signed barter updates, with read controls, preferences, retry status and encrypted-backup support. No push/email delivery is configured.
- Terminal installation/configuration diagnostics, static browser build, public-asset-only offline cache and cross-platform CI definitions.
- Public signed-file verification from the terminal: `node tools/cli/classrup.mjs record verify --file listing.json [--json]`. It verifies supported listing/withdrawal envelopes, payloads, author binding and listing expiry without keys, network requests or persistence. Chain history, revocation, current ownership and trust remain unestablished; private domain CLI workflows remain planned. See the [command and output contract](docs/CLI_SETUP.md#verify-a-public-signed-file).
- Public terminal listing and search: `listing list`, `listing show` and `search` read explicitly selected signed files, replay their revisions/withdrawals through the shared PWA handlers in temporary memory, and return bounded, deterministic pages. Search supports text, coarse region, category, kind, condition and exact currency/minor-unit filters. These commands do not open browser vaults or retained databases. See the [CLI guide](docs/CLI_SETUP.md).
- Exact money arithmetic, rational conversion and allocation as a headless 38-digit library, independently checked against Python vectors. Existing alpha wire amounts retain their previous bounds; this library does not add payment settlement.
- An opt-in currency registry validates a snapshot against a configured release signer and preserves immutable decimal/chain bindings. Registry seeding and commerce UI remain disabled until an authenticated snapshot, downstream usage adapters and the canonical-vault integration exist. No exchange-rate provider is configured.
- An opt-in signed-consent core with revision/participant/wording binding and monotonic revocation. Its product adapters, backup codecs and quarantine are pending, so it is not enabled in the PWA.
- An opt-in feature catalog and dependency registry contains 18 feature definitions, 148 module definitions and 565 dependency edges, with deterministic generation, immutable catalog data and four read-only query definitions. Build and CI reject stale generated output. Catalog registration and default states describe compiled specification policy; they do not establish runtime implementation or enable a feature for a user. PWA controls, runtime flag adapters, relay mounting, backup diagnostics, unknown-module quarantine and target-device qualification remain separate work. See the [package scope](packages/platform/README.md).

Signing keys, exported backups and local domain rows are encrypted. Existing plaintext vaults migrate atomically after successful unlock. Storage uses authenticated row encryption, opaque row keys and an authenticated inventory; table names, row counts and ciphertext sizes remain visible. Alpha backup covers registered domain records and identity, not the complete media/outbox/device-rotation recovery protocol. Keep the original vault passphrase for backup and restore. Browser origin changes create separate storage locations.

Storage transaction handles expire before durable commit or rollback. Synchronous callbacks are revoked before yielding; asynchronous callbacks are revoked when the wrapper observes their promise's settlement. Already queued microtasks can run before that observation, so callers must await all transaction work. Retained handles cannot access a later transaction or closed storage. This does not erase data already copied by a caller or expand backup coverage.

Fresh identity creation allows at most three sequential native Ed25519 generation attempts, retrying only genuine `DOMException` values named `OperationError`. Recovery ends before key export or persistence; unlocking and restoring never regenerate an existing identity. The pinned WebKit build still has a deterministic leading-zero private-key import defect. This remains a compatibility limitation despite the new-key availability mitigation; see the [native diagnostic and review](docs/reviews/20261117-exhaustive-consolidation/native-keygen-review.md).

The alpha signed-file protocol uses per-subject chains and explicitly experimental statement types where full federation contracts are not implemented. It is not interoperable canonical relay federation. Peer statements are claims, not proof of physical availability. Reservations only protect local inventory; conflicting peer commitments freeze coordination. No payment custody or atomic physical exchange is provided.

Services, rentals, auctions, live messaging, relay delivery, full identity rotation/recovery, governance policy packs, quantity inventory, comprehensive accessibility review and canonical protocol closure remain incomplete. Specification-only packages have no runtime entry points; missing submodules are not exported as if implemented.

## Verification and navigation

```sh
corepack pnpm typecheck
corepack pnpm spec:check
corepack pnpm deps:check
corepack pnpm registry:check
corepack pnpm test --reporter=json --outputFile=test-results/domain.json
corepack pnpm run test:cli
corepack pnpm run test:tooling
corepack pnpm trace --results test-results/domain.json
corepack pnpm run status --results test-results/domain.json --write
corepack pnpm run test:browser
```

Trace coverage requires executed passing results; source comments never establish passing coverage. The non-strict report is not a release gate. Browser tests require Playwright's browser installations.

- [November 19 feature completion](docs/development/FEATURE_COMPLETION_20261119.md): public CLI queries, explicit value removal, transaction lifetime enforcement and malformed-price validation, with candidate-specific evidence.
- [Comprehensive consolidation outcome](docs/development/CONSOLIDATION_HANDOFF.md) · [Remaining development work](docs/development/REMAINING_WORK.md)
- [Completed main qualification](docs/reviews/20261117-exhaustive-consolidation/main-qualification-20261118.json): main `5a502aa` passed its own 695 domain assertions, 27 tooling tests, 72 browser journeys and all six platform jobs. Later sources require their own qualification.
- [Consolidation execution and current outcome](docs/status/CONSOLIDATION_EXECUTION_20261117.md) · [All 57 branch dispositions](docs/status/CONSOLIDATION_BRANCH_DISPOSITIONS_20261118.md)
- [52-branch / 47-PR starting inventory](docs/status/BRANCH_CONSOLIDATION_20261117.md) · [Inventory JSON](docs/status/BRANCH_CONSOLIDATION_20261117.json)
- [Earlier 25-PR review](docs/status/PR_CONSOLIDATION_20261117.md) · [Future domain CLI specification](docs/future-cli-spec.md)
- [Current bounded security review](docs/reviews/20261117-exhaustive-consolidation/security-review.md) · [Registry integration review](docs/reviews/20261117-exhaustive-consolidation/registry-independent-review.md)
- [Project status](docs/status/PROJECT_STATUS.md) · [Feature status (generated)](docs/status/FEATURE_STATUS.md) · [Branch ledger](docs/status/BRANCH_LEDGER.md) · [Changelog](CHANGELOG.md)
- [User guide](docs/wiki/User-Guide.md) · [Developer guide](docs/wiki/Developer-Guide.md) · [Wiki source and publication status](docs/wiki/README.md)
- [Integration plan / evidence](planning/LOCAL_ALPHA_20261109.md)
- [Barter signed-file walkthrough](docs/BARTER_ALPHA.md)
- [Vault backup boundaries](packages/vault/README.md) · [Federation boundaries](packages/federation/README.md) · [Bazaar scope](packages/bazaar/ALPHA_SCOPE.md)
- [Project specification](PROJECT_SPEC.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy](INDEX.md)
- [Canonical contracts](planning/CONTRACTS.md) · [Architecture ADR-0016](planning/adr/ADR-0016.md)
- [Independent security review](planning/verification-foundation.md) · [Independent matching review](planning/verification-mutiny.md)
