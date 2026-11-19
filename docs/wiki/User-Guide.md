# User Guide

[Home](Home.md) · [Developer Guide](Developer-Guide.md)

## What is available?

The default `main` branch contains an unreleased browser development alpha. It supports a local encrypted vault, signed listings, explicit file exchange, bounded barter matching and coordination, listing history/archive recovery, coarse-area preferences and an in-app inbox. No server account or configured relay is required. See the [current README](../../README.md) for the precise scope.

## Getting started

Install Git, Node **22.18.0 or newer** and the pinned **pnpm 10.28.0** toolchain. The [CLI setup guide](../CLI_SETUP.md) covers operating-system prerequisites and Corepack availability.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git switch main
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

Open the URL printed by `dev`, normally `http://127.0.0.1:4173/`. Use `pnpm run setup` and `pnpm run doctor`; the bare commands belong to pnpm itself. The terminal builds and serves the browser application. It does not unlock the vault or hold its private keys.

Keep using the same browser profile and origin. Changing the scheme, hostname or port selects a different browser storage location. `localhost` and `127.0.0.1` are distinct origins.

## Vault and backup

Create or unlock a vault in the browser. Signing keys and domain records are encrypted locally. Existing plaintext vaults migrate after a successful unlock; the migration commits atomically. The visible database still exposes table names, row counts and ciphertext lengths. See the [vault implementation boundaries](../../packages/vault/README.md).

Sessions default to a 15-minute idle lock, configurable from 1 to 60 minutes for the session, and lock after five continuous minutes hidden. Lock hides private views and closes vault access. Local unlock backoff is not a defense against offline password guessing or a complete database rollback.

Export the encrypted alpha backup before substantial updates and preserve the original vault passphrase. Restore validates the bundle and restores supported records into a new empty vault. The original signing identity still needs its original passphrase. The backup is not complete account/device recovery: media, kernel delivery history and delegated-device rotation/revocation are outside its current scope.

## Listings and file exchange

1. Create a listing with its public details, exact value where applicable and optional coarse location. Private notes stay in the owner vault.
2. Edit draft or unpublished listings locally. Saving does not publish. Published listings must be explicitly unpublished before editing.
3. Publish and share the signed listing file through a channel you choose. Other users import the file into their own vaults.
4. Review retained peer listings and their verification status. A signature establishes control of a signing key; it does not prove ownership or physical availability of an item.
5. Close, unpublish or archive your own listings as appropriate and share signed withdrawal evidence where generated. A download does not prove a recipient received it.

To remove an optional declared value, select **Remove declared value** in the editor and save. Clearing the amount alone does not remove it; `0` remains a value. Cancel or lock to discard an unsaved removal. Sale listings still need a declared value before publication. Wanted and giveaway listings can be republished without one. Existing signed files and history retain their previous values. See [declared-value editing](../LISTING_VALUE_EDITING.md) for the exact behavior.

Owner history records public-field snapshots and publication-state changes beginning with the implemented history version. Owner listing pages show 50 items at a time. New archive records have a 90-day local-clock restore window; restoring returns the listing unpublished. Existing legacy archives do not receive an invented deadline. Expiry and archive maintenance runs while the vault is unlocked. Complete purge remains unfinished.

## Local barter

Exchange the listing and want files needed for a cycle, then use **Local barter coordination** to discover bounded suggestions. Matching requires available, unexpired and unconflicted signed inputs, compatible coarse regions and matching declared currencies. Wants have a 15-minute aging period.

A suggestion becomes a proposal only after explicit action. Each participant reviews the exact cycle, reserves their own item, signs consent and exchanges the relevant evidence files. Commitment requires the matching evidence and a fresh local feasibility check. Local inventory holds are not distributed locks and cannot guarantee physical exchange. The [barter walkthrough](../BARTER_ALPHA.md) documents each step and the recovery behavior.

Matching runs in a cancellable background worker. Locking or cancelling rejects stale results. Signing keys and vault storage stay outside that worker.

## Location and notifications

Coarse-area preferences are private vault records and are included in encrypted backups. A one-time device-position request can reduce a position to a coarse tile; copying that region into a listing or search is explicit. Precise-location sharing is not implemented.

The in-app inbox records accepted signed barter updates with read controls, preferences and retry information. No push or email delivery provider is configured.

## Remaining product work

Live relay delivery, private messaging, full device/account recovery, published-edit reconfirmation, quantity inventory, services, rentals, auctions, payment settlement, complete privacy lifecycle and release qualification remain incomplete. Opt-in money, currency-registry and consent libraries do not by themselves enable those workflows. The [project status](../status/PROJECT_STATUS.md) distinguishes implementation evidence from remaining acceptance work.

## Troubleshooting

- **A vault appears missing:** check the browser profile, hostname and port before creating another vault. Local browser storage is tied to the origin.
- **An import is rejected:** use the original signed file and review the referenced listing/proposal revisions and expiry. Editing signed content changes what its signature authenticates.
- **Coordination freezes after restore:** restored commitments require explicit review; cached feasibility is not accepted as fresh evidence.
- **The local port is occupied:** use `corepack pnpm run configure --port 4181`, then `corepack pnpm run doctor` and restart the server. That new port has separate browser storage.
- **A command runs pnpm setup instead of ClassRup:** include `run` in `pnpm run setup` and `pnpm run doctor`.

The [CLI setup guide](../CLI_SETUP.md) and [vault README](../../packages/vault/README.md) contain the detailed setup and restore contracts.
