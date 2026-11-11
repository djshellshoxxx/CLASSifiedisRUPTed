# Future specification: Classrupted CLI (LocalBazaar + LocalMutiny)
Status: PLANNED / FUTURE ONLY. This is a proposed interface, not an implemented command-line product.

## Goal
Expose the canonical marketplace and barter workflows to operators, developers and automation without requiring the mobile PWA. Respect the project architecture: static PWA is not a trusted backend; authenticated relays/services own authorization, persistence and validation. No CLI-only shortcut around those boundaries.

## Proposed commands
- `classrup --help|--version`; `classrup doctor`; `classrup config validate`; `classrup serve`
- `classrup user show|list|suspend`; `classrup listing create|show|list|edit|expire|export`
- `classrup category list|validate`; `classrup search --region REGION --category CATEGORY --json`
- `classrup trade propose|show|list|withdraw`; `classrup offer create|counter|accept|reject`
- `classrup match explain|simulate --fixture FILE`; `classrup moderation queue|review`
- `classrup message diagnose`; `classrup federation status|peers|verify` (only when federation exists)
- `classrup migrate status|up`; `classrup backup create|verify`; `classrup export listings|account`
- `classrup demo seed --fixture FILE --isolated` for deterministic local testing, never production by default.
Auctions, rentals, and federation commands remain gated behind their respective future modules.

## Core guarantees
CLI and PWA must share server-side validation, authorization, rate limits, event versioning and audit semantics. Never expose exact home addresses in public listings, search, logs or federated payloads. A pseudonym does not imply anonymity. A barter cycle requires unique participants, compatible assets, bounded matching, pinned value assumptions, explicit all-party consent, expiry handling and concurrency protection. Revised proposals invalidate prior consent where material. Never claim settlement solely from a signature or self-attested evidence. No custodial wallet or implicit escrow.

## Automation contract
Stable command help and exit codes (0 success, 2 validation, 3 failure, 4 no results, 5 cancellation); versioned JSON output, stderr diagnostics, pagination, `--dry-run` for mutations, timeouts, idempotency keys, explicit API endpoint/profile selection, noninteractive CI. Authenticate via secure local credential storage or scoped tokens; no secrets in shell history. Support Windows/Linux/macOS and documented shell completion when feasible.

## Acceptance criteria
1. Listing create/edit/expire/search through CLI yields identical results to canonical API.
2. Unauthorized moderation, trade acceptance and listing edits fail without mutations.
3. Two-party and 3+ party matching fixtures are deterministic, bounded and explain rejected candidates.
4. Concurrent acceptance, participant dropout, proposal revision and expiry cannot cause partial or silent settlement.
5. Public JSON, logs and export fixtures exclude private address and credential fields.
6. `demo seed` refuses production endpoints unless explicitly supported by a separately approved policy.
7. CLI error/JSON/exit-code tests and an end-to-end headless LocalBazaar + LocalMutiny scenario pass CI.

## Phased plan
F0: map approved process specs, current services and ownership; resolve API contracts.
F1: help, doctor, config, read-only listing/search.
F2: authenticated listing, offers, bilateral barter.
F3: cyclic matching explain/simulate, moderation and operational backup/export.
F4: optional auctions/rentals/federation once their modules are approved and implemented.
Do not interrupt existing implementation owners or represent this proposal as beta-ready.
