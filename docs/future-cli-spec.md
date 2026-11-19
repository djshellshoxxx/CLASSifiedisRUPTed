# Future specification: client-owned ClassRup domain CLI

**Status: F1a verification and files-only F1b public listing/search implemented; private CLI workflows planned.** The supported `node tools/cli/classrup.mjs record verify --file FILE [--json]` command verifies existing signed listing and alpha withdrawal files. `listing list`, `listing show` and `search` evaluate explicitly selected public files through shared PWA retention/search handlers in temporary memory. These commands do not access a vault, persist records or change any storage/signature format. The broader command families below remain a delivery plan.

## Source and architectural reconciliation

This specification adapts the previously unintegrated proposal from `planning/future-cli-specs-20261110`, commit [`af4dcc546e6342fb34d717d4050b52b8ffe7ffa3`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/af4dcc546e6342fb34d717d4050b52b8ffe7ffa3), path `docs/future-cli-spec.md`. The command families, automation contract, staged delivery and acceptance goals are retained. Its assumptions that servers own user authorization and persistence are replaced by the accepted [ADR-0016](../planning/adr/ADR-0016.md): users own their keys and records, vaults validate incoming signed statements, and relays provide optional services.

The existing [setup CLI](CLI_SETUP.md), [kernel](../packages/kernel/src/index.ts), [vault](../packages/vault/src/index.ts), [listing domain](../packages/bazaar/src/index.ts) and [barter domain](../packages/mutiny/src/index.ts) are the integration baseline. This proposal does not activate a parallel domain implementation from an older branch.

## What exists today

The supported setup commands are `pnpm run setup`, `pnpm run configure`, `pnpm run doctor`, `pnpm dev`, `pnpm build` and `pnpm preview`. `node tools/cli/classrup.mjs --help` describes their current interface. They configure, build and serve public PWA assets. The F1a `record verify` command additionally checks an explicitly selected, bounded public listing/withdrawal file using shared envelope and PWA payload validation. It provides schema-version-1 JSON and exits 0/2/3, with fixed redacted errors. Its output explicitly leaves prior history, chain continuity, revocation, current ownership and trust unestablished, and performs no vault admission. See the [CLI guide](CLI_SETUP.md#verify-a-public-signed-file) for the implemented contract. No current terminal command creates or unlocks browser vaults, holds user keys, or executes private listing/barter mutations.

F1b additionally provides `node tools/cli/classrup.mjs listing list/show` and `node tools/cli/classrup.mjs search` with repeated explicit `--file` selection. It uses bounded file input, owner-qualified show selectors, shared filters, deterministic revision handling, fail-closed conflicting histories, terminal-safe public output and snapshot-bound offset pagination. Every selected file must pass current admission, including expiry. List/search returns 0 for an empty successful collection; show returns 4 when no matching selected publication remains. See the [public listing guide](CLI_SETUP.md#list-show-and-search-public-listing-files) for its exact grammar, JSON contract, limits and evidence boundaries. It does not read a persisted retained cache or browser vault.

The `classrup …` examples below describe a proposed future executable and command grammar. Only the documented `node tools/cli/classrup.mjs` forms for verification and files-only listing/search are implemented from the domain families. Bare `pnpm setup` and `pnpm doctor` remain pnpm's own commands; the supported project scripts use `pnpm run`.

## Goal and authority

Provide local workflows for users and automation without requiring the PWA UI or a product-operated backend. The CLI must call the same domain handlers, validation, capability checks, revision rules and signed-statement admission logic as the PWA. A CLI flag cannot grant authority that the local principal lacks.

The first usable phase reads public signed-record files without private keys. Private commands require a separately implemented encrypted file-vault adapter with explicit schema compatibility and tested import/export boundaries. The CLI must not read a browser profile's IndexedDB files directly, attach to an unlocked browser session implicitly, or copy keys into `.classrup/local.json`. That file remains non-secret build/serve configuration.

An encrypted backup imported into a CLI vault creates an explicit working copy. It is not automatically synchronized with the browser vault. Before allowing either copy to publish or accept cross-party commitments, the implementation must detect stale or forked signed chains, preserve revision checks, and require reconciliation. It must not silently overwrite one copy with another. Existing identity, record IDs, CIDs, signature bytes and history stay stable across a compatible round trip.

Users select each optional relay explicitly. Relay roles authorize only that relay's index, mailbox or hosted resources. They do not allow changing another user's vault, globally suspending an identity, or silently signing for a user. An unavailable relay leaves local work available and delivery status pending or unknown.

## Proposed command families

| Family | Proposed interface | Authority and prerequisite |
|---|---|---|
| Help and configuration | `classrup --help`, `--version`; `config validate`; `doctor` | Preserve existing setup diagnostics. Distinguish local vault selection from non-secret public-serving configuration. |
| Public verification and discovery | `record verify`; `listing show`, `list`; `search --region REGION --category CATEGORY --json` | Read only explicitly selected public records or local retained public projections. Verify signatures and label incomplete/untrusted provenance. |
| Local identity | `identity show`; `vault status`, `lock` | Show the selected local principal. Private access requires a supported local encrypted vault and explicit unlock. No global user directory or central account service. |
| Owner listings | `listing create`, `edit`, `publish`, `close`, `archive`, `restore`, `export` | Execute existing owner commands with their actual revision, expiry, inventory and signed-withdrawal rules. Do not invent a CLI-only state transition. |
| Taxonomy | `category list`, `validate` | Use the same selected policy/version and validation as the product. Do not activate an unimplemented policy-pack workflow. |
| Trade and offers | `trade propose`, `show`, `list`, `withdraw`; `offer create`, `counter`, `accept`, `reject` | Expose only domain operations that exist and have complete local, signed-exchange and backup adapters. New offer workflows stay gated until those dependencies exist. |
| Matching | `match explain`; `match simulate --fixture FILE` | Deterministic bounded matching with explicit value assumptions, expiry, unique participants and validated fixture input. |
| Encrypted backup and export | `backup create`, `verify`; `vault import`; `export listings`, `account` | Explicit source, destination and disclosure scope. Authenticate encrypted exports and preserve IDs/history. Plaintext private export requires an explicit supported mode. |
| Local filtering | `filter block`, `unblock`, `list` | Affect only the selected user's local view and supported signed advisory subscriptions. |
| Optional relay operations | `relay status`, `peers`, `verify`; `relay moderation queue`, `review` | Require a named relay and scoped role. Relay deletion or rejection changes only that relay's hosted resources. No global suspension command. |
| Private messaging diagnostics | `message diagnose` | Available only after messaging exists. Report transport and key-binding status without plaintext, private addresses or conversation contents. |
| Storage migration | `vault migrate status`, `up` | Explicit encrypted file-vault migration with version checks, backup, atomic commit and tested recovery. Never modify browser storage implicitly. |
| Isolated fixtures | `demo seed --fixture FILE --isolated` | Create disposable local test data. Refuse a user vault or relay target; fixture mode must not publish statements or send messages. |

Auctions, rentals, services, payment settlement and broader federation commands remain unavailable until their corresponding product workflows and authority boundaries are implemented and verified. A valid signature or a user's statement does not prove payment settlement or physical handover. No custodial wallet or implicit escrow is introduced.

## Local key and persistence requirements

Private keys and passphrases stay local. Interactive unlock uses a concealed input prompt; unattended signing needs an explicit local credential mechanism or protected input channel chosen by the user. Secret command-line arguments, diagnostic output, crash details and public JSON must not expose keys, passphrases, private message text or exact home addresses. Relays receive only the authorized signed public projection or encrypted payload.

The file-vault adapter must provide authenticated encryption, bounded decoding, verified restore before mutation, atomic writes, crash recovery and a single-writer or conflict-detection strategy. Interrupted commands must not leave a record changed without its corresponding history, event or signed statement. A locked or disposed session must reject late asynchronous results. Secrets must have a documented lifecycle; the implementation must state the limits of memory clearing in its runtime.

Recovery and deletion require explicit scope. Local deletion, encrypted-backup retention, signed public withdrawal and deletion from a selected relay are different operations. Neither the CLI nor a relay can promise erasure of another party's retained copy.

## Automation contract

- Versioned JSON output goes to stdout; bounded, redacted diagnostics go to stderr. Human and JSON modes use the same result/error semantics.
- Proposed stable exits are `0` success, `2` validation failure, `3` operation or infrastructure failure, `4` no results, and `5` cancellation. These are future domain-CLI semantics, not a change to current setup-tool exit behavior. Document how a query distinguishes an empty successful collection from a command requiring a matching record before fixing its exit code.
- Explicit `--vault` and, where applicable, `--relay` or named profile selection prevent accidental operation on another identity or service. Output identifies the selected principal and scope without revealing secrets.
- Mutations support operation-scoped idempotency and optimistic revision checks where the shared domain supports them. Retrying must not create duplicate listings, accept stale proposals or bypass revocation.
- `--dry-run` validates and reports intended effects without committing, signing, sending, creating persistent secrets or altering an idempotency record. It is not a promise that a later real execution will pass unchanged concurrency checks.
- Commands have bounded input sizes, timeouts, cancellation, pagination and deterministic ordering. Avoid loading an unbounded vault or graph into memory.
- Noninteractive mode fails clearly when authorization, unlock or required consent is missing. It never falls back to a more privileged account or weaker storage mode.
- Validate Linux, Windows and macOS behavior for paths, permissions, locking, atomic replacement and exit handling. Shell completion is optional after the command grammar stabilizes.

## Acceptance criteria

1. The existing setup/configure/doctor/build/dev/preview interface remains operational and continues to keep browser vaults and private files out of public assets.
2. Public signed-record verification rejects malformed, tampered, unsupported or unauthorized records with the same admission rules as the PWA. It never treats signature validity alone as permission to mutate another owner's record.
3. Equivalent CLI and PWA listing operations produce equivalent domain state and signed projections, including history, expiry, close/archive/restore behavior and inventory conflicts. Unknown or unsupported operations fail without side effects.
4. A non-owner listing edit, unauthorized trade acceptance, stale revision, expired proposal, revoked signer and relay-role escalation all fail without partial mutation.
5. Two-party and three-or-more-party matching fixtures are deterministic and bounded, explain rejected candidates, preserve explicit value assumptions and require all necessary consent. No local lock is described as a global reservation or atomic physical exchange.
6. Encrypted PWA backup to CLI import to export to PWA restore preserves supported records, ownership, signature references and history. Wrong passphrases, foreign-vault data, unsupported versions, duplicate/conflicting chains and truncated files fail before a destination changes.
7. Concurrent processes, a stale working copy, partial writes, forced interruption and delayed completion after lock cannot silently lose data or admit stale signed work. Recovery tests cover the supported filesystems and platforms.
8. Public JSON, errors, logs, fixture exports and diagnostics exclude private addresses, raw secrets and private message content. Private exports use explicit disclosure scope.
9. Isolated fixture mode refuses an existing user vault and every network publication target. Dry-run and cancellation leave domain state, keys and external services unchanged.
10. CLI error, JSON-schema, exit-code and idempotency tests pass, together with a headless owner-listing and signed-barter journey using real shared-domain adapters. Optional relay tests remain separate and cannot become a requirement for ordinary local use.

## Delivery sequence

| Phase | Deliverable | Completion gate |
|---|---|---|
| F0 | Map current handlers, backup formats, signing/admission boundaries and unsupported commands. Specify the versioned JSON contract and local-vault threat model. | Review shows every proposed command has one domain owner and an explicit local or optional-relay authority. |
| F1 | Help/version, configuration diagnostics, public-record verification and read-only local listing/search. | No private-key access or implicit network use; negative record/admission cases and output contract pass. |
| F2 | Encrypted file-vault adapter and compatible backup import/export; local identity status and owner-listing commands. | Round-trip compatibility, crash/concurrency, foreign-vault, lock/session and privacy tests pass across supported platforms. |
| F3 | Supported bilateral/cyclic barter, matching explanations and complete CLI/PWA parity for implemented workflows. | Real signed exchanges, stale/forked history, consent, expiry and retry tests pass. |
| F4 | Optional relay operations and later product modules. | Each adapter and feature passes its own authority, privacy and end-to-end gates before its commands become available. |

F1a delivers the public-record verification subset of F1. It accepts only listing and alpha tombstone records. Its subprocess tests cover independently signed Ed25519 fixtures, malformed/tampered/unsupported records, PWA payload-validation parity, expiry, ownership binding, bounded file reads, fixed error disclosure, file-type refusal and network-free execution.

F1b delivers files-only public listing/show/search with the same supported signed formats. Its tests cover independent signatures, shared PWA query equivalence, duplicate files/CIDs, per-owner revisions, signed withdrawals, conflict refusal, deterministic pagination, snapshot changes, current expiry, exact currency filters, bounded inputs, redacted failures, terminal-control escaping and guards against network/key-generation/signing/persistent-write side effects. A standalone executable, `--version`, persisted-cache/file-vault access and private workflows remain unfinished. Platform qualification must be tied to the actual candidate's CI results, not inferred from these test definitions.

Implementation should proceed through small verified contributions. This specification preserves a useful orphan proposal; it does not mark domain CLI parity, messaging, relay operation or any other future feature complete.
