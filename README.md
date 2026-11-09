# CLASSifiedisRUPTed (ClassRup)

Local-first classifieds and cyclic barter, with user-held identities and optional relays. The browser vault is the product; a server account is not required.

**Development alpha, not a completed milestone or production release.** This branch adds real domain implementations and a browser composition on top of the Stage 3/4 kernel. Automated domain tests and builds are separate from browser acceptance; see the [integration ledger](planning/LOCAL_ALPHA_20261109.md) for exact evidence and blockers.

## Run from a terminal

Requires Node >=22.18.0 and the pinned pnpm 10.28.0. See the [CLI setup guide](docs/CLI_SETUP.md) for Windows, macOS and Linux prerequisites, configuration, troubleshooting and static hosting.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git switch codex/local-alpha-20261109
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

Use `pnpm run setup` and `pnpm run doctor`: both bare names collide with pnpm's own built-in commands. Setup preserves settings and browser data. `pnpm run configure --port 4180` explicitly changes non-secret settings. `pnpm build` creates `dist/`; `pnpm preview` serves it locally. Production static hosting requires HTTPS. No mandatory Docker, database server, relay or paid service.

## Implemented scope and limits

- Ed25519 identities, encrypted signing-key storage, explicit lock/unlock, per-vault IndexedDB persistence and signed/encrypted record backup into a new vault.
- Single-item listing lifecycle, exact minor-unit values, signed public projections, explicit file exchange, retained peer verification and revision/fork checks.
- Bounded deterministic barter graph enumeration, independently checked against small-graph oracles; signed alpha proposal, consent and reservation state transitions with explicit consistency limits.
- Terminal installation/configuration diagnostics, static browser build, public-asset-only offline cache and cross-platform CI definitions.

Signing keys and exported backups are encrypted. **Local domain records are not encrypted at rest.** Alpha backup covers registered domain records and identity, not the complete media/outbox/device-rotation recovery protocol. Keep the original vault passphrase for backup and restore. Browser origin changes create separate storage locations.

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
corepack pnpm run test:browser
```

Trace coverage requires executed passing results; source comments never establish passing coverage. The non-strict report is not a release gate. Browser tests require Playwright's browser installations.

- [Integration plan / evidence](planning/LOCAL_ALPHA_20261109.md)
- [Barter signed-file walkthrough](docs/BARTER_ALPHA.md)
- [Vault backup boundaries](packages/vault/README.md) · [Federation boundaries](packages/federation/README.md) · [Bazaar scope](packages/bazaar/ALPHA_SCOPE.md)
- [Project specification](PROJECT_SPEC.md) · [Project TODO](PROJECT_TODO.md) · [Full hierarchy](INDEX.md)
- [Canonical contracts](planning/CONTRACTS.md) · [Architecture ADR-0016](planning/adr/ADR-0016.md)
- [Independent security review](planning/verification-foundation.md) · [Independent matching review](planning/verification-mutiny.md)
