# Native Ed25519 generation: evidence and bounded mitigation review

**Review date:** November 18, 2026. This record covers the published PR #48
candidate [`e331e56165304c98a1c2bdd26692772b586e499d`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/e331e56165304c98a1c2bdd26692772b586e499d).
It was prepared at the source-review checkpoint, before that candidate's hosted
qualification completed. Final CI and merge outcomes belong to the
[consolidation execution record](../../status/CONSOLIDATION_EXECUTION_20261117.md).

## 1. Product failure that triggered this work

The first registry candidate, `336839cdf5fb912e3f2eb84c2fecba12243b26ec`, passed its
combined domain step, build and six platform jobs, but its
[Alpha run 44260769800](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44260769800),
[domain job 134657774064](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44260769800/job/134657774064),
finished with **65 browser journeys passed and one failed**. The failed journey
was WebKit's `idle vault lock clears private views and preserves saved listings`.
Failure occurred in the creation helper, before its idle-lock assertions: the
workspace remained hidden and the alert identified `generate-key` as the failed
native operation.

The sanitized application error did not retain the native exception class or
key material. It localizes the failed operation; it does not identify the byte
pattern behind that individual rejection. The candidate changed the registry,
not the vault/browser cryptography, and was withheld after this failure.

The [original failure artifact](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44260769800/artifacts/14410512965)
has SHA-256:

```text
fb8e8205327f8b8cdb0551b0b097b6c35c8053d3cadc5cbc05e93e9943a99244
```

## 2. Independent native diagnostic on the pinned browser

The existing [two strict probes](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/764557187d51903630d3f864c4ee2fa56c3b7c6a/tests/compat/browser-crypto/ed25519.spec.ts)
were executed unchanged on Linux with Playwright 1.64.1 and its WebKit build
2370. The diagnostic source is
`764557187d51903630d3f864c4ee2fa56c3b7c6a`;
[run 44268543372](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372),
[job 134679038898](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372/job/134679038898),
completed with a **failure** conclusion. Both probes failed their original strict
assertions. The failed diagnostic remains evidence of incomplete native compatibility.

| Probe | Observed result |
|---|---|
| 512 native generation/export/reimport trials | 505 completed; seven failed during `generate` with `OperationError` |
| Failed trial numbers | 102, 130, 131, 136, 271, 280, 318 |
| Leading-zero private-key vector | `DataError` at `private-import` |
| All-zero private-key vector | `DataError` at `private-import` |
| Nonzero control | Completed; exported bytes preserved, reference signature matched, verification passed |

The probe records an exception name only when the caught value is a
`DOMException` instance; otherwise it records the generic label `Error`.
Thus the seven reported `OperationError` values establish the eligible native
exception class on this exact browser build. These operations exercise the native
API directly, independently of the application's proposed recovery helper.

The [diagnostic artifact](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372/artifacts/14411164647)
has SHA-256:

```text
9b448b41e3f79027bb08c4b5c0c5c01e3a9c7734179f4ab92e6618da3511f0bf
```

The two result files below are byte-identical copies from that artifact. They
contain only counts, trial numbers, vector labels, operation stages, exception
names and boolean results. No generated key bytes, passphrases, signatures,
principal identifiers, native exception messages or temporary download credentials
are copied into these records.

| File | SHA-256 |
|---|---|
| [ed25519-operation-results.json](ed25519-operation-results.json) | `7190635a9806b0bb2d5e06ca1a9e21f190f196d81b4c987922e987cda4c081be` |
| [ed25519-fixed-width-results.json](ed25519-fixed-width-results.json) | `f3064d682b74a6a760d418ed81ce1e6e31fea808fc3fe1b84140713c997cc399` |

## 3. Native source cause and version boundary

The [pinned WebKit source](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebCore/crypto/gcrypt/CryptoKeyOKPGCrypt.cpp)
converts generated Ed25519 public and private material through `mpiData`, then
rejects results whose lengths differ from 32 bytes. That conversion removes
leading zero bytes. Reviewed upstream
[commit e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b](https://github.com/WebKit/WebKit/commit/e6eb9ebd41d6a54df8db2dc86603c3a8139abf5b)
replaces the affected conversions with fixed-width conversion and validates SPKI
input length before padding. It covers generation, SPKI/PKCS#8 import and JWK
export. The commit was reviewed by Javier Fernandez and dated October 9, 2026.

The source defect and same-build native failures support the leading-zero
explanation. No trace of the particular key material behind the original product
failure was captured, so that individual rejection is not assigned a stronger
cause than the evidence supports.

The [upstream review snapshot](webkit-keygen-upstream-review.json), captured at
`2026-11-18 08:36:12 UTC`, records these exact versions and source checks:

| Distribution | Source checked | Fixed-width repair |
|---|---|---|
| Pinned Playwright 1.64.1 / WebKit 2370 | WebKit `56453fdfe0b0ca6258c23e6453b34f70b885d13f` | Absent |
| Latest stable Playwright at the snapshot, 1.65.1 | WebKit `5b391e6d3b14d549908dad2c6695999291313f30` | Absent |
| Official npm nightly `1.66.0-alpha-2026-11-18` / WebKit 2395 | Playwright `8124fc39233c4c349b9dbebd4abc4103738eae81`; WebKit `aa697ddd0312b191de5fb13b580f19159d39c26f` | Absent |
| Stable WebKitGTK 2.54.2 | Tag `webkitgtk-2.54.2`, commit `b95c91b1c0ee43cc86d25ff7af73038f67a88e04` | Present |

Both Playwright bootstrap patches were checked for a backport: stable blob
`ab31e39a60fcc511607003e8d8a87bdc201287d4` and nightly blob
`cca97804759b711b6470df17be044c8eae424293` contain no affected Ed25519/MPI repair.
The exact configuration, native sources, patch URLs and nightly provenance are
listed in the JSON snapshot. That snapshot is a source-review record; its
`noChanges` field describes that review's own lack of mutations, not later work.
Its SHA-256 is `54041d3ac60369ef087a892e36e9179ae13636d58dc950e82d8a15980eab85ef`.

A released fixed native backend does exist in
[WebKitGTK 2.54.2](https://webkitgtk.org/2026/10/23/webkitgtk2.54.2-released.html).
Stock WebKitGTK is not a qualified replacement for Playwright's patched browser:
[Playwright requires corresponding browser binaries and patches](https://playwright.dev/docs/browsers#webkit).
Neither the reviewed stable Playwright package nor its current nightly supplies
the repair. No dependency bump, custom browser substitution or algorithm change
was made on the strength of a version label alone.

## 4. Bounded application mitigation

The [candidate identity helper](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/e331e56165304c98a1c2bdd26692772b586e499d/packages/identity/src/identity.ts)
allows at most **three total sequential native generation calls** for a new
identity. A retry requires a `DOMException` instance named `OperationError`.
Success returns immediately; other errors stop immediately; exhaustion preserves
the fixed `generate-key` error stage and redaction behavior.

Each attempt uses the same native Ed25519 API, extractability and usages. The
helper does not substitute an algorithm, generate key material in JavaScript,
alter randomness, or relax validation. Recovery ends before public/private export,
sealing, import and persistence. Export, import, signing, verification, decryption,
backup restore and persistence are outside the retry loop. Existing identities
are never regenerated in response to an unlock or restore failure.

The bound addresses an availability failure while preserving a finite failure
path. `OperationError` is not proof of the leading-zero cause; that is why the
policy is limited to fresh generation and a fixed number of attempts. Three
attempts do not guarantee success and do not establish native compatibility.

## 5. Validation and independent source review

| Evidence at the source-review checkpoint | Result and scope |
|---|---|
| Identity suite | 23 tests passed locally |
| Vault recovery integration suite | Three tests passed locally |
| Bounded full-workspace typecheck | Passed |
| Setup and production build | Passed |
| Browser discovery | 72 definitions: the original 66 plus two new journeys across three engines; this is discovery, not execution |
| Independent source review | No blocking security, correctness or coverage defect found in the bounded candidate |
| Candidate hosted CI | Pending at this checkpoint; final outcomes are recorded separately |

The [identity tests](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/e331e56165304c98a1c2bdd26692772b586e499d/packages/identity/src/identity.test.ts)
cover one- and two-failure recovery, sequential behavior, exhaustion without
export/import, ineligible rejection classes, an eligible failure followed by an
ineligible one, unchanged downstream failures and private-buffer clearing.
Recovered keys retain their principal and signature behavior through lock/unlock.

The [vault tests](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/e331e56165304c98a1c2bdd26692772b586e499d/tests/integration/identity-keygen-recovery.test.ts)
check absence of persisted identity after exhaustion, a later explicit create,
exclusive opening and closure guards during pending generation, and identity
preservation through signing, lock and encrypted backup restore.

The [two new browser journeys](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/e331e56165304c98a1c2bdd26692772b586e499d/tests/browser/identity-keygen.spec.ts)
inject controlled generation failures, then delegate successful generation to the
browser's original native implementation. They cover persistent signed listings,
lock/unlock without regeneration, exhaustion with a locked UI, and subsequent
explicit creation under the same vault name. They retain genuine native failures
as failures if the bounded recovery cannot succeed.

The original 66 product journeys, both raw probes, test retry settings and
dependency files are unchanged. The Alpha workflow addition only prints observed
assertion counts after the existing domain command; its failure gate is retained.
The independent review inspected code and evidence without rerunning the suites
or changing the candidate. Local passing results do not replace hosted browser
qualification, and prior interrupted local combined runs remain documented.

## 6. Remaining compatibility limitation

The raw diagnostic proves that the pinned backend still rejects valid existing
private keys with leading zero bytes. Generation recovery does not repair that
deterministic import path. Affected unlock/restore operations preserve the original
identity and fail closed; they do not create a replacement identity or silently
change the backup format.

Complete native compatibility requires a qualified browser build containing the
reviewed fixed-width repair, followed by the strict native vectors/trials and
product journeys. A source-only JWK feasibility observation in the upstream JSON
is not an implemented import workaround and was excluded from this bounded change.
The [vault scope documentation](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/e331e56165304c98a1c2bdd26692772b586e499d/packages/vault/README.md)
keeps this limitation explicit. The development alpha and broader recovery
contracts remain incomplete.
