# WebKit cryptography investigation — November 16, 2026

## Observed application failure

PR #37 at `ca2664664a652a7a9b97c4cbebafb509bc41e40b` passed 29 of 30 browser journeys in [Alpha verification run 43844325449](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43844325449). The first WebKit journey failed while creating the `alice` vault. The application's error region showed the native message “The operation failed for an operation-specific reason.” The screenshot did not identify the failing operation.

`packages/identity/src/identity.ts` creates an Ed25519 pair, exports the public key as raw bytes, exports the private key as PKCS#8, seals those bytes, and imports the private key as nonextractable. Any of the native key operations can reject. The failure is consistent with the upstream defect below, but the original failure's exact stage was not captured. A successful rerun does not establish that the defect is absent.

## Verified upstream defect and version boundary

- [Playwright v1.64.1's WebKit configuration](https://github.com/microsoft/playwright/blob/v1.64.1/browser_patches/webkit/UPSTREAM_CONFIG.sh) pins `56453fdfe0b0ca6258c23e6453b34f70b885d13f`; the installed package selects WebKit build 2370.
- [The source at that pinned revision](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebCore/crypto/gcrypt/CryptoKeyOKPGCrypt.cpp) converts generated Ed25519 public/private material with `mpiData`, then rejects key material whose length is not 32 bytes. The integer conversion removes leading zero bytes.
- [WebKit fix e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b](https://github.com/WebKit/WebKit/commit/e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b), associated with [bug 307095](https://bugs.webkit.org/show_bug.cgi?id=307095), replaces that conversion with fixed-width conversion. Its commit records intermittent Ed25519 generation failures and rejection of affected PKCS#8/SPKI imports.
- [Playwright v1.65.0](https://github.com/microsoft/playwright/blob/v1.65.0/browser_patches/webkit/UPSTREAM_CONFIG.sh) and [v1.65.1](https://github.com/microsoft/playwright/blob/v1.65.1/browser_patches/webkit/UPSTREAM_CONFIG.sh) both pin `5b391e6d3b14d549908dad2c6695999291313f30`. [That source still contains the defective conversion](https://github.com/WebKit/WebKit/blob/5b391e6d3b14d549908dad2c6695999291313f30/Source/WebCore/crypto/gcrypt/CryptoKeyOKPGCrypt.cpp). A stable dependency bump alone does not resolve this defect.

No application cryptography, accepted input, signature validation, standard browser tests, or retry policy is changed by this diagnostic work. The Playwright dependency remains pinned at 1.64.1.

## Separate reproduction suite

Run `corepack pnpm run test:browser:crypto --project=webkit` on a host that can launch the pinned browser. Chromium and Firefox can be selected with their corresponding `--project` names. This is a separate diagnostic command and is not part of the ordinary product acceptance suite.

The fixed-width test uses public deterministic Ed25519 test seeds, computes reference signatures using Node's independent implementation, and checks browser import, byte preservation, signing and verification. It includes an all-zero seed and a leading-zero seed. These vectors are expected to reveal the affected GCrypt backend rather than conceal it with retries.

The operation test performs 512 independent generation/export/reimport trials. A failed trial is recorded and never converted into a pass by another trial. Reports contain only trial numbers, fixed stage names and exception names; no generated key bytes, passphrases, signatures or principal identifiers are attached. The whole test fails if any trial fails.

Both tests use normal assertions, zero retries and no browser-specific skips. Standard application journeys remain unchanged. Local browser execution was unavailable in this workspace because browser Unix sockets are prohibited; test discovery and typechecking can run locally, but browser results require another execution host.

Once a released Playwright version includes the upstream fix, pin it together with its lockfile update and run both this suite and all product journeys. Until then, retain this compatibility issue as unresolved; do not describe a rerun as a cryptographic fix.
