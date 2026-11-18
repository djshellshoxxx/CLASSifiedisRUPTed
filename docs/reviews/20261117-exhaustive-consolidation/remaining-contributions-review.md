# Remaining contributions — final reconciliation addendum

**Review date:** 2026-11-18. **Candidate:** `e331e56165304c98a1c2bdd26692772b586e499d`.
Its Git tree matches tested local commit `0423d71ffb340c4dabb9931b705eccd628d3fe21`.
This read-only review compared Git objects, source, the [starting inventory](../../status/BRANCH_CONSOLIDATION_20261117.md), and saved native diagnostic results. It ran no additional tests and does not establish that pending CI or a merge completed.

**Recommendation:** retain the precise deferrals below. No additional immediately usable, low-risk runtime contribution was established. This is a bounded reconciliation result, not a claim that all remaining features or specifications are complete.

## Previously integrated contributions remain present

For each of the six branches previously integrated by content, the changed paths from its recorded merge base were compared with the candidate. All **66 changed-path entries** remain present: **38 byte-identical, 28 different, zero missing**.

| Branch | Pinned source head | Paths | Identical | Different | Missing |
|---|---|---:|---:|---:|---:|
| `agents/ci/trim-workflows` | [`3f41b81accf0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/3f41b81accf062b2031504bd2e98d2913fb17fb8) | 4 | 3 | 1 | 0 |
| `agents/discovery/coarse-filters` | [`4f60ff9fa121`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/4f60ff9fa121435b962801d6594d9fca413d5bb7) | 9 | 5 | 4 | 0 |
| `agents/governance/taxonomy-prohibited` | [`997249164e4b`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/997249164e4b32df443dbbe2e07f729311c9cdeb) | 14 | 12 | 2 | 0 |
| `agents/moderation/rate-limits-signals` | [`c098f1bf9175`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/c098f1bf91759afd8ab0519ba04fa27671605de5) | 10 | 4 | 6 | 0 |
| `agents/notify/prefs-inapp` | [`d6076d18621e`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/d6076d18621e16ec5b6a87e210f99bd305cf6243) | 10 | 0 | 10 | 0 |
| `agents/privacy/classification-metadata-consent` | [`2752f04dd27c`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/2752f04dd27c6df90ffa5d22d479e77ae2688a86) | 19 | 14 | 5 | 0 |

“Different” is a content comparison, not automatic proof of semantic equivalence. The [earlier source review](../20261117-pr-consolidation/parked-modules-review.md) documents subsequent corrections. This recheck establishes that none of the recorded paths disappeared; it does not rerun their tests.

## Remaining PR #8 source

Source: `claude/bold-mccarthy-qklhl6` at [`a403614bb34d3d176d4693730e512e14959718b8`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/a403614bb34d3d176d4693730e512e14959718b8), compared from common ancestor `3694395272e880d929fcb53693ddd70e14bc47bf`. The 34 changed TypeScript/script paths were classified against the candidate. The feature-registry extraction addresses the independently bounded contribution identified in the [pinned runtime review](../20261117-pr-consolidation/pr8-runtime-review.md).

| Remaining source at that head | Concrete prerequisite |
|---|---|
| `packages/kernel/src/ids/uuidv7.ts`; `validation/schemas.ts` | Hour-floored public IDs need a defined public-record adoption boundary, preservation of existing signed references, validation and migration/backup tests. Unused helpers alone do not implement that privacy requirement. |
| `packages/security/src/cryptography/signatures/primitives/fed-envelope.ts` and related primitives | The proposed base64url CID, optional `prev`, and delegated signer handling differ from the current alpha envelope. Require independent vectors, explicit wire versioning, delegation/revocation authority and compatible admission/recovery adapters. |
| `packages/security/src/authz/secrets/{loader,rules,compare}.ts` | Relay secret/token helpers have no current consumer. Require an actual optional relay composition and filesystem, reload, redaction and failure tests; they do not complete a PWA workflow. |
| `packages/kernel/src/storage/{driver,memory-driver,tx,machines,ports}.ts` | Finish adapter parity and persistence migration while preserving current sync/encryption. At the old head, `tx.ts:640` still calls removed `syncStore`; wholesale replacement would discard later qualified behavior. |
| `packages/platform/src/configuration/tenants/schema.ts` | Explicitly retain this partial **Tenants/LocalSettings** work in the deferral list. Its 322-line schema imports absent `./text.ts` and relies on future rules, relay configuration, authorization and enforcing consumers. It is not a completed tenant/settings feature. |

The old head's previously recorded compile/test failures are evidence about that source, not current-candidate failures. This review did not rerun them or treat untested helpers as production-ready implementations.

## Three deferred live heads

### Alternate runtime: `claude/busy-cerf-vg3hz3`

Pinned head: [`34a6892cff8babb01c41f42d04df85bf6860fa34`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/34a6892cff8babb01c41f42d04df85bf6860fa34).

`packages/kernel/src/ids.ts` uses prefixed ULIDs; `packages/comms/src/messaging/private.ts` uses the alternate collection/command interfaces. `packages/comms/src/client.ts:6` explicitly establishes relay-directory trust and relay-asserted sender attribution. These differ from the current scoped asynchronous kernel and user-held vault authority. Porting requires identity, persistence, wire-format and authorization adapters, with end-to-end tests. Preserve the current image parser: the [executed legacy comparison](legacy-image-proof.json) already demonstrates regressions in `packages/comms/src/messaging/strip.ts`. Behavioral tests and domain ideas remain useful references, but no drop-in runtime slice was established.

### Services and related drafts: `claude/happy-newton-4yttpa`

Pinned head: [`8d5f66f75411debbfe9377679005cfadb6b679c0`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/8d5f66f75411debbfe9377679005cfadb6b679c0).

The diff beyond archived PR #18 head `e402bd56352ae62cb3adcd3ba201a94a06b6217d` contains **150 Markdown paths and no runtime source**. In `03_Services/01_service_catalog/mod_availability/{domain_schema,authorization_capabilities}.md`, ULID records and booking-service authority remain proposals. The candidate's corresponding generated specification uses UUIDv7 and provider-vault ownership. Reconcile selected requirements into `module.spec.yaml` and accepted contracts before regeneration; do not replace generated documents with the incompatible draft.

### Broad specification proposal: `claude/wonderful-cori-ynhlsb`

Pinned head: [`c9bd8933ff519e97ed97bb132432103a2ad29fe4`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/tree/c9bd8933ff519e97ed97bb132432103a2ad29fe4).

The diff beyond archived PR #36 head `3a5c9e36e22a635104dfecf41641b438c95fa239` contains **1,770 Markdown/CSV paths and no runtime source**. `DECISIONS.md:3` still marks D01–D10 OPEN, whereas the candidate records their accepted ADRs. `planning/SPEC_COMPLETENESS_REPORT.md` retains provisional owners/prefixes and that branch's NO-GO. Preserve its provenance and evaluate useful requirements against current decisions; its historical gate cannot replace the current acceptance record.

## Product qualification and native crypto remain separate

The [same-build native diagnostic run](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372), [job 134679038898](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372/job/134679038898), used WebKit 2370 and unchanged direct-native probes in `tests/compat/browser-crypto/ed25519.spec.ts` at diagnostic head `764557187d51903630d3f864c4ee2fa56c3b7c6a`. That triggering commit has the same tree as its diagnostic-workflow parent `7e123ec5701d6643bd6bfb88ea0b392e56a5486e`.

The saved results show **512 trials, 505 completed, seven generate-stage `OperationError` failures**. Leading-zero and all-zero private-key import vectors fail with `DataError`; the nonzero control preserves bytes and matches/verifies an independent signature. Both strict raw tests remain failed. This meets the prior evidence threshold for the observed failure class without proving the exact cause of every historical CI event.

Candidate `packages/identity/src/identity.ts` limits recovery to three fresh sequential native generation calls for genuine `DOMException`/`OperationError` rejections. It preserves downstream operations and stored identities. Candidate `packages/vault/README.md` correctly distinguishes this **new-key creation availability mitigation** from the unresolved deterministic import defect. Unlock/restore can still fail for valid affected existing keys and must never generate replacements.

The candidate retains the original 66 product journeys and adds two journeys per engine, yielding 72 planned product checks. Their exact-source hosted results and required CI gates belong in the integration owner's final qualification record. Passing product checks would not make the two raw native probes pass or establish a complete engine repair. This addendum claims neither CI completion nor merge completion.
