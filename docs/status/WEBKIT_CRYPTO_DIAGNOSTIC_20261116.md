# WebKit cryptography investigation — November 16, 2026

## Subsequent consolidation evidence

The earlier dated checkpoints below are retained as history. The first registry
candidate `336839cdf5fb912e3f2eb84c2fecba12243b26ec` later passed 65 of 66 product
journeys in [run 44260769800](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44260769800).
Its WebKit failure occurred during initial identity creation, and the sanitized
application artifact identifies `generate-key`. It does not expose the underlying
native exception or prove the cause of that individual invocation.

The unchanged raw probes then executed on the pinned WebKit build in
[run 44268543372](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372).
They recorded seven generation `OperationError` failures in 512 trials and
deterministic `DataError` failures for leading-zero and all-zero private-key
imports. Both strict diagnostic tests failed; the nonzero control preserved key
bytes and matched and verified the reference signature. These results reproduce
the native compatibility defect on a working browser host.

[PR #48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) adds a bounded
new-key creation mitigation at `e331e56165304c98a1c2bdd26692772b586e499d`: at most
three sequential native generation calls, with another attempt allowed only for
a genuine `DOMException` named `OperationError`. Export, import, signing,
decryption and existing-key restoration retain their original failure behavior.
The raw probes and original 66 product journeys remain unchanged; six new
real-native browser journeys exercise recovery and exhaustion.

The [native review and retained evidence](../reviews/20261117-exhaustive-consolidation/native-keygen-review.md)
record source pins, artifact hashes, local regressions and the unresolved import
limitation. Stable WebKitGTK 2.54.2 contains the upstream repair, but it is not a
drop-in Playwright browser. The inspected Playwright stable and nightly builds
still lack the fix. The [execution report](CONSOLIDATION_EXECUTION_20261117.md)
records actual product qualification and integration results; a finite passing
product run does not make these failed raw primitive probes pass.

## Observed application failure

PR #37 at `ca2664664a652a7a9b97c4cbebafb509bc41e40b` passed 29 of 30 browser journeys in [Alpha verification run 43844325449, attempt 1](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43844325449/attempts/1). [Domain job 133233196047](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43844325449/job/133233196047) failed the first WebKit journey while creating the `alice` vault: `#workspace` remained hidden at the creation helper. The application's error region showed the native message “The operation failed for an operation-specific reason.” The screenshot did not identify the failing operation.

The attempt matters. [Attempt 2](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43844325449/attempts/2), at the same source SHA, also passed 29 of 30 journeys but failed a different Chromium assertion waiting for `#error` to become visible ([job 133354240884](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43844325449/job/133354240884)). A latest-attempt API lookup therefore does not reproduce the original WebKit evidence.

`packages/identity/src/identity.ts` creates an Ed25519 pair, exports the public key as raw bytes, exports the private key as PKCS#8, seals those bytes, and imports the private key as nonextractable. Any of the native key operations can reject. The failure is consistent with the upstream defect below, but the original failure's exact stage was not captured. A successful rerun does not establish that the defect is absent.

## Verified upstream defect and version boundary

- [Playwright v1.64.1's WebKit configuration](https://github.com/microsoft/playwright/blob/v1.64.1/browser_patches/webkit/UPSTREAM_CONFIG.sh) pins `56453fdfe0b0ca6258c23e6453b34f70b885d13f`; the installed package selects WebKit build 2370.
- [The source at that pinned revision](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebCore/crypto/gcrypt/CryptoKeyOKPGCrypt.cpp) converts generated Ed25519 public/private material with `mpiData`, then rejects key material whose length is not 32 bytes. The integer conversion removes leading zero bytes.
- [WebKit fix e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b](https://github.com/WebKit/WebKit/commit/e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b), associated with [bug 307095](https://bugs.webkit.org/show_bug.cgi?id=307095), replaces that conversion with fixed-width conversion. Its commit records intermittent Ed25519 generation failures and rejection of affected PKCS#8/SPKI imports.
- [Playwright v1.65.0](https://github.com/microsoft/playwright/blob/v1.65.0/browser_patches/webkit/UPSTREAM_CONFIG.sh) and [v1.65.1](https://github.com/microsoft/playwright/blob/v1.65.1/browser_patches/webkit/UPSTREAM_CONFIG.sh) both pin `5b391e6d3b14d549908dad2c6695999291313f30`. [That source still contains the defective conversion](https://github.com/WebKit/WebKit/blob/5b391e6d3b14d549908dad2c6695999291313f30/Source/WebCore/crypto/gcrypt/CryptoKeyOKPGCrypt.cpp). A stable dependency bump alone does not resolve this defect.

At this original diagnostic checkpoint, application cryptography, accepted input,
signature validation, standard browser tests and retry policy were unchanged.
The later bounded generation mitigation is described above. The Playwright
dependency remains pinned at 1.64.1.

## Separate reproduction suite

Run `corepack pnpm run test:browser:crypto --project=webkit` on a host that can launch the pinned browser. Chromium and Firefox can be selected with their corresponding `--project` names. This is a separate diagnostic command and is not part of the ordinary product acceptance suite.

The fixed-width test uses public deterministic Ed25519 test seeds, computes reference signatures using Node's independent implementation, and checks browser import, byte preservation, signing and verification. It includes an all-zero seed and a leading-zero seed. These vectors are expected to reveal the affected GCrypt backend rather than conceal it with retries.

The operation test performs 512 independent generation/export/reimport trials. A failed trial is recorded and never converted into a pass by another trial. Reports contain only trial numbers, fixed stage names and exception names; no generated key bytes, passphrases, signatures or principal identifiers are attached. The whole test fails if any trial fails.

Both tests use normal assertions, zero retries and no browser-specific skips. Standard application journeys remain unchanged. Local browser execution was unavailable in this workspace because browser Unix sockets are prohibited; test discovery and typechecking can run locally, but browser results require another execution host.

Once a released Playwright version includes the upstream fix, pin it together with its lockfile update and run both this suite and all product journeys. Until then, retain this compatibility issue as unresolved; do not describe a rerun as a cryptographic fix.

## Consolidation recheck — November 17, 2026

PR #37 is already merged as `3fd5fdbc89f81bc1267ca907a7a1fb9a13943828`.
Its final head `a189787ab6cc0741743da0cd0cf8b0a9cd2e39dc` subsequently passed
[Alpha verification 43889531898](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43889531898)
and [CLI setup 43889532000](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43889532000).
The PR must not be integrated again as though it remains open.

The later browser source `0c2e9e2992c359fd60f827983bd5e3f432bc8771` passed all
**66 Chromium/Firefox/WebKit journeys** in
[Alpha verification 44227269816](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269816),
[domain job 134543666967](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269816/job/134543666967).
The starting main `c4f733e8f2e13c38844acc84b2401209bedf4e24` has an identical tree for
`apps/`, `packages/`, `tests/`, `tools/`, `.github/`, dependency manifests/lockfile,
and the TypeScript, Vitest and Playwright configurations. This establishes
source-equivalent product-journey evidence; it does not claim an Actions run
occurred at the documentation-only main SHA or that the separate crypto probes
passed.

The [latest stable Playwright release](https://github.com/microsoft/playwright/releases/latest)
was rechecked and remains
[v1.65.1](https://github.com/microsoft/playwright/releases/tag/v1.65.1).
Its pinned `5b391e6d3b14d549908dad2c6695999291313f30` WebKit source still uses
`mpiData` for fixed-width Ed25519 material and rejects non-32-byte results.
No fixed Playwright dependency release was verified. Keep the dependency pinned and the
original native-cryptography trust boundary intact. The reproducible upstream
defect remains a compatibility blocker even though finite product-journey runs
have passed; the exact cause of the original vault-creation failure remains
unconfirmed.

### Local diagnostic execution on the consolidation host

The pinned Playwright 1.64.1 dependencies installed from the unchanged lockfile.
Its official download fallback supplied WebKit 2370, without substituting an
older browser. `test:browser:crypto --project=webkit --trace off` attempted both
probes, but both failed before test execution because browser launch requires
six absent native libraries: `libgtk-4.so.1`, `libgraphene-1.0.so.0`,
`libharfbuzz-icu.so.0`, `libmanette-0.2.so.0`, `libhyphen.so.0` and
`libGLESv2.so.2`. This host has no configured package-install helper or `sudo`.
These failures do not reproduce a cryptographic operation failure.

The same command with the exact cached Firefox 1555 timed out after 120 seconds
while setting up the first test's `page` fixture. The runner was interrupted
during the second fixture because the first result established the host launch
blocker. No crypto assertion ran and no Firefox pass is claimed. Test discovery
still finds both probes for all three configured browsers (six tests total).

At that checkpoint, the two probes still required a host with the pinned
browsers' native dependencies and working processes. The subsequent hosted
execution above supplies those results without changing the raw probes or their
assertions. The original PR #37 invocation's exact stage remains unconfirmed;
the later PR #48 application failure directly identifies generation.
