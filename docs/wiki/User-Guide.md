# User Guide

[Home](Home.md) · [Developer Guide](Developer-Guide.md)

## What is available?

The public default branch is **planning/specifications only**. [Draft PR #10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10) contains an **unreleased experimental browser alpha** for local vaults, signed listings, verified file exchange, bounded local barter suggestions, and explicit proposal/hold/consent coordination. Use only that reviewed draft commit if evaluating the alpha. There is no production service, app-store distribution, hosted account or live relay to log in to.

**Not complete:** automatic relay delivery/federation, private-domain-record encryption, complete key/device recovery, quantity-aware inventory, counteroffer editing, end-to-end handover/physical delivery confirmation, production-grade moderation and release qualification.

## Getting started (developer-preview alpha)

You need Git, Node **22.18.0+**, Corepack/pnpm **10.28.0**, and a modern browser with WebCrypto and IndexedDB. Commands below are for local technical evaluation; they do **not** install the planning-only default branch as a functional app.

```sh
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
git checkout 429fcfca9735a323a6ce709d8605429d6c850fdb
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

Open the local URL reported by `dev` (normally `http://127.0.0.1:4173/`). Local preview is not hardened production hosting. For Windows PowerShell, macOS/Linux bootstrap and configuration options see the [source-pinned CLI setup guide](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/docs/CLI_SETUP.md). In particular **use `pnpm run setup` and `pnpm run doctor`**, not the identically named pnpm built-in commands.

## Basic local workflow

1. **Create a vault:** choose a local vault name and a sufficiently strong passphrase in your browser. Signing keys are encrypted; safeguard the passphrase and exported backup. Unlocking a vault is local and does not register a server account.
2. **Create a listing:** enter title, description, declared value, coarse region, and availability; save locally. Publish a *signed file* if you want someone else to verify/import it. Saving a draft does not automatically publish to others.
3. **Exchange verified listings:** send the downloaded signed JSON file via a channel you choose. A peer manually imports it; the application checks the signature and source constraints. A downloaded file is **not proof of delivery**.
4. **Barter:** after the required **15-minute want-aging period**, discover eligible bounded cycles, review your exact offered/received items, propose and export the signed proposal, and share evidence with every participant. Each participant must import the files, reserve their own item and **explicitly consent** to the exact immutable proposal. Suggestions or downloads alone are never consent or a distributed lock.
5. **Withdraw/review:** distribute any signed withdrawal and follow the local coordination state. Conflicting claims, missing holds and restored commitments require review; the app cannot reverse a real-world handover.
6. **Back up and recover:** export the **encrypted alpha backup** and store it securely. Restore only to a new empty vault and re-evaluate commitments. The alpha backup does not include every media/outbox/delivery state and is **not a complete multi-device recovery kit**.

For the exact supported buttons and edge cases consult the [barter alpha workflow](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/docs/BARTER_ALPHA.md) and [vault limitations](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/packages/vault/README.md).

## Privacy and safe use

- **Keys and backups** are encrypted locally. **Other domain records are currently plaintext in IndexedDB**; locking the UI does not encrypt the browser database or erase device memory. Protect the browser profile and device accordingly.
- Signed files may reveal a public key identifier, declared value, coarse location, timestamps and listing information to recipients. Pseudonyms do **not** promise anonymity.
- There is **no central custody of keys or funds**. No relay is configured in the alpha; future relays are optional and untrusted, and physical delivery is not guaranteed by digital signatures.
- Local holds prevent simultaneous reuse only within the same vault, **not between devices or independent copies of a restored identity**. Participants must review conflicting evidence themselves.
- Do not assume an offer or proposed cycle is binding without the exact participants' valid signatures and their independent real-world verification.

## Troubleshooting and FAQ

**Why does `git clone` show specifications rather than an app?** Because main is planning-only. Switch to the reviewed draft alpha commit above or wait for an authorized merge.

**Why is a listing invisible to my friend?** This build requires manual export, transfer and import of signed files; no background relay is configured.

**Why are no barter cycles suggested?** Verify both sides imported relevant signed files; matching requires appropriate value/currency, compatible coarse region, availability, valid evidence and the 15-minute want-aging interval. Truncation/time bounds may also limit results.

**Can I restore without the passphrase?** Not with this alpha. There is no server-side password reset.

**Does my lock screen protect all stored data?** No. Only signing keys and exported backups are encrypted; other local records remain plaintext.

**How can I verify a failed import?** Check that you selected the original signed file, not an edited representation; invalid/tampered inputs are rejected. Recheck current proposal revision and signatures.

**Where are developer tests and contribution details?** See the [Developer Guide](Developer-Guide.md).
