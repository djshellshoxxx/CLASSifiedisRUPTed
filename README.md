# CLASSifiedisRUPTed (ClassRup)

Local-first classifieds and cyclic barter, with user-held identities and optional relays. The browser vault is the product; a server account is not required.

**Development alpha, not a completed milestone or production release.** This branch adds real domain implementations and a browser composition on top of the Stage 3/4 kernel. Automated domain tests and builds are separate from browser acceptance; see the [current project status](docs/status/PROJECT_STATUS.md) for evidence and blockers.

## Run from a terminal

Requires Node >=22.18.0 and the pinned pnpm 10.28.0. See the [CLI setup guide](docs/CLI_SETUP.md) for Windows, macOS and Linux prerequisites, configuration, troubleshooting and static hosting.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git switch main   # qualified baseline; unmerged feature PRs are separate candidates
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
- Browser editing for draft/unpublished listings, preserving exact values and private notes. Saving an edit never publishes it; published items must be explicitly unpublished first.
- Bounded deterministic barter graph enumeration, independently checked against small-graph oracles; signed alpha proposal, consent and reservation state transitions with explicit consistency limits.
- Local inbox for accepted signed barter updates, with read controls, preferences, retry status and encrypted-backup support. No push/email delivery is configured.
- Terminal installation/configuration diagnostics, static browser build, public-asset-only offline cache and cross-platform CI definitions.
- Exact money arithmetic, rational conversion and allocation as a headless 38-digit library, independently checked against Python vectors. Existing alpha wire amounts retain their previous bounds; this library does not add payment settlement.
- An opt-in signed-consent core with revision/participant/wording binding and monotonic revocation. Its product adapters, backup codecs and quarantine are pending, so it is not enabled in the PWA.

Signing keys, exported backups and local domain rows are encrypted. Existing plaintext vaults migrate atomically after successful unlock. Storage uses authenticated row encryption, opaque row keys and an authenticated inventory; table names, row counts and ciphertext sizes remain visible. Alpha backup covers registered domain records and identity, not the complete media/outbox/device-rotation recovery protocol. Keep the original vault passphrase for backup and restore. Browser origin changes create separate storage locations.

The alpha signed-file protocol uses per-subject chains and explicitly experimental statement types where full federation contracts are not implemented. It is not interoperable canonical relay federation. Peer statements are claims, not proof of physical availability. Reservations only protect local inventory; conflicting peer commitments freeze coordination. No payment custody or atomic physical exchange is provided.

Services, rentals, auctions, live messaging, relay delivery, full identity rotation/recovery, governance policy packs, quantity inventory, comprehensive accessibility review and canonical protocol closure remain incomplete. Specification-only packages have no runtime entry points; missing submodules are not exported as if implemented.

## Verification and navigation

```sh
corepack pnpm typecheck
corepack pnpm spec:check
corepack pnpm deps:check
corepack pnpm test --reporter=json --outputFile=test-results/domain.json
corepack pnpm run test:cli
corepack pnpm run test:tooling
corepack pnpm trace --results test-results/domain.json
corepack pnpm run status --results test-results/domain.json --write
corepack pnpm run test:browser
```

Trace coverage requires executed passing results; source comments never establish passing coverage. The non-strict report is not a release gate. Browser tests require Playwright's browser installations.

- [Project status](docs/status/PROJECT_STATUS.md) · [Feature status (generated)](docs/status/FEATURE_STATUS.md) · [Branch ledger](docs/status/BRANCH_LEDGER.md) · [Changelog](CHANGELOG.md)
- [Integration plan / evidence](planning/LOCAL_ALPHA_20261109.md)
- [Barter signed-file walkthrough](docs/BARTER_ALPHA.md)
- [Vault backup boundaries](packages/vault/README.md) · [Federation boundaries](packages/federation/README.md) · [Bazaar scope](packages/bazaar/ALPHA_SCOPE.md)
- [Project specification](PROJECT_SPEC.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy](INDEX.md)
- [Canonical contracts](planning/CONTRACTS.md) · [Architecture ADR-0016](planning/adr/ADR-0016.md)
- [Independent security review](planning/verification-foundation.md) · [Independent matching review](planning/verification-mutiny.md)
