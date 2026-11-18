# Parked module and CI PR consolidation review

## Decision

Close PRs **#26, #29, #30, #31, #32, and #33 as superseded by the content integration already present on `main`**. Retain the source branches and exact head SHAs. No useful unique source change was found that requires another merge or cherry-pick.

The six heads are not Git ancestors of the inspected main, and `git cherry` reports their commits as unique. This is a history difference: it does **not** mean their source changes are missing. Every one of their 66 changed paths exists on main; 38 match byte for byte. The other 28 preserve the original feature alongside later corrections, exports, wiring, tests, and integration notes. Entire branch replacement or conflict resolution in favor of the old branches would lose these corrections.

Baseline inspected: `50abc470139a613f4404bdb9fb442f4011c13932`.

Core incorporation: `449621a30327b6ccb21eed8b02f08b17c857e664` (reviewed modules and CI), `104df65e4b9f592c514bd15b7fc9656986eda941` (consent and PNG security fixes plus local notification composition), `ca2664664a652a7a9b97c4cbebafb509bc41e40b` (search wiring and rollback-safe clock), all ancestors of main. `docs/status/BRANCH_LEDGER.md` explicitly records this as content integration, and its November 16 outcome names all six source branches.

## Standards review

No `AGENTS.md`, CONTRIBUTING, or separate CODING_STANDARDS file was found in the checked-out repository. Applicable project contracts and module notes were read. There is no additional standards blocker to closing these superseded PRs. The important source-diff constraints are:

- Preserve Result-based validation and bounded category expansion in discovery. Main repairs a category-root boundary that bypassed the 200-category expansion cap, and converts date underflow to `VALIDATION_FAILED` rather than a thrown `RangeError`.
- Preserve signed envelope sequence/previous-CID validation and explicit owner/channel binding in notification code. Main checks the signer output before committing local consent/preference changes; rejected signer output leaves storage/events/sync unchanged in regression tests.
- Preserve privacy-minimizing diagnostics. Main removed raw network prefix retention/logging from rate-exceeded diagnostics and isolates throwing logger/notice callbacks from enforcement.
- Preserve immutable validated rate-policy snapshots. Main validates direct startup/import paths, locks security classes to their required failure mode, and prevents later caller mutation of policy objects.
- Retain all committed later CI gates. Main's `alpha-checks.yml` adds independent Python money vectors and browser bundle-size verification to the old workflow. The old branch contains no replacement for these checks.

Baseline smell heuristics were treated as judgment calls. No heuristic-only refactor is warranted for closure of already-integrated branches; rewriting these modules would enlarge the consolidation scope without recovering missing PR content.

## Specification review

The PR bodies accurately describe unfinished isolated modules at the historical pause. Those descriptions are now stale as consolidation status, while the remaining functional limitations still matter. Closing these PRs does **not** certify full product completion:

- **#26**: coarse geohash library is unchanged; the filter compiler is enhanced by two boundary fixes and regression tests. Main exports the modules and supplies a separate retained-listing local query adapter. The legacy SQL filter library still normalizes amounts to bounded numbers; its mismatch with canonical decimal-string money remains explicitly documented. The local product adapter is the appropriate integration rather than substituting the legacy SQL schema. Unmeasured load, query-plan and metrics rows are not proven by consolidation.
- **#29**: all original notifications modules are present. Main adds local notification backup wiring and a barter coordination route; grants in the future are rejected; revocations remain possible after the grant/edit budget is exhausted; withdrawals bind to the stored user and channel; withdrawal/deletion paginates past 500 historical records. Signed mirror/consent sequence and previous-CID checks add regression coverage. Push/email delivery remains unconfigured; broader relay scheduling and full privacy-consent integration are not complete.
- **#30**: all 12 code/test files are identical. Only the two module NOTES files append integration status. Namespace/subpath exports now exist outside the original diff. Policy-pack product flows, composition-root persistence, scheduled lifecycle and PWA wiring are still incomplete as recorded on main. No source salvage is needed.
- **#31**: classification and most image/network helpers are identical. Main strengthens PNG parsing against duplicate headers, unsupported critical chunks, invalid IEND payloads, incompatible bit depths, palette/transparency ordering and non-consecutive IDAT data, with hostile-input regressions. Original limitations remain: no pixel decode/downscale/orientation application, broader codec/composition wiring and consent-module completion are not demonstrated by this PR.
- **#32**: limits and signals behavior is retained; rate enforcement has later security fixes. A thrown observability callback no longer enters a fresh fail-open degraded budget; wall-clock rollback cannot earn capacity again while catching up; direct policy load/application is validated and copied. Kernel-port use and end-user composition/lifecycle gaps still require their own acceptance evidence.
- **#33**: CLI workflow, planner, and planner tests are identical; Alpha verification only has two additional money checks. Its once-unrun source is already integrated. The planner's policy (domain-only PRs get Linux/Chromium, main gets full matrices) remains a known qualification scope, not proof of all platforms on every PR.

## Validation performed

Read all six PR bodies, commit lists, full changed-path inventories, and every per-file delta against the pinned main. Compared complete blob bytes for all 66 changed paths, rather than relying on commit ancestry, titles, or patches alone. Reviewed relevant current exports, README scope, branch ledger, module NOTES, CI definitions and test diffs. No files in the repository checkout were changed and no GitHub mutation was performed by this reviewer. Runtime test execution is left to the parent integration worker's combined-tree verification; no new passing-test count is claimed here.

## Per-PR exact source comparison

### PR #26

- Source: `agents/discovery/coarse-filters` at `4f60ff9fa121435b962801d6594d9fca413d5bb7`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `packages/discovery/src/geoprivacy/coarse/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/discovery/src/geoprivacy/coarse/coarse.test.ts` | Byte-identical |
| `packages/discovery/src/geoprivacy/coarse/geohash.ts` | Byte-identical |
| `packages/discovery/src/geoprivacy/coarse/index.ts` | Byte-identical |
| `packages/discovery/src/geoprivacy/coarse/test-support.ts` | Byte-identical |
| `packages/discovery/src/geoprivacy/coarse/vectors.json` | Byte-identical |
| `packages/discovery/src/search/filter/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/discovery/src/search/filter/filter.test.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/discovery/src/search/filter/index.ts` | Original retained with reviewed main-side additions/fixes |

### PR #29

- Source: `agents/notify/prefs-inapp` at `d6076d18621e16ec5b6a87e210f99bd305cf6243`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `packages/notify/src/delivery/inapp/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/delivery/inapp/inapp.test.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/delivery/inapp/index.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/delivery/inapp/routing.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/in/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/in/in.test.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/in/index.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/opt/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/opt/index.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/notify/src/preferences/opt/opt.test.ts` | Original retained with reviewed main-side additions/fixes |

### PR #30

- Source: `agents/governance/taxonomy-prohibited` at `997249164e4b32df443dbbe2e07f729311c9cdeb`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `packages/governance/src/policy/goods/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/governance/src/policy/goods/goods.test.ts` | Byte-identical |
| `packages/governance/src/policy/goods/index.ts` | Byte-identical |
| `packages/governance/src/policy/goods/model.ts` | Byte-identical |
| `packages/governance/src/policy/goods/pack.ts` | Byte-identical |
| `packages/governance/src/policy/goods/seed.ts` | Byte-identical |
| `packages/governance/src/policy/goods/view.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/governance/src/policy/prohibited/evaluate.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/index.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/model.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/normalize.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/pack.ts` | Byte-identical |
| `packages/governance/src/policy/prohibited/prohibited.test.ts` | Byte-identical |

### PR #31

- Source: `agents/privacy/classification-metadata-consent` at `2752f04dd27c6df90ffa5d22d479e77ae2688a86`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `packages/privacy/src/security_boundaries/metadata/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/privacy/src/security_boundaries/metadata/bytes.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/errors.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/formats.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/privacy/src/security_boundaries/metadata/image.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/import.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/index.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/metadata.test.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/privacy/src/security_boundaries/metadata/network.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/metadata/test-fixtures.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/privacy/src/security_boundaries/metadata/tiff.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/privacy/src/security_boundaries/model/classes.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/classification.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/errors.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/geohash.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/index.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/model.test.ts` | Byte-identical |
| `packages/privacy/src/security_boundaries/model/redact.ts` | Byte-identical |

### PR #32

- Source: `agents/moderation/rate-limits-signals` at `c098f1bf91759afd8ab0519ba04fa27671605de5`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `packages/moderation/src/antifraud/limits/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/limits/index.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/limits/limits.test.ts` | Byte-identical |
| `packages/moderation/src/antifraud/rate/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/rate/engine.ts` | Byte-identical |
| `packages/moderation/src/antifraud/rate/index.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/rate/rate.test.ts` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/signals/NOTES.md` | Original retained with reviewed main-side additions/fixes |
| `packages/moderation/src/antifraud/signals/index.ts` | Byte-identical |
| `packages/moderation/src/antifraud/signals/signals.test.ts` | Byte-identical |

### PR #33

- Source: `agents/ci/trim-workflows` at `3f41b81accf062b2031504bd2e98d2913fb17fb8`
- Declared base: `75d4bf51433ebddef56c86c4065d9619ebe02058`
- Disposition: superseded by reviewed content already on main; preserve source branch.

| Changed path | Comparison with main |
|---|---|
| `.github/workflows/alpha-checks.yml` | Original retained with reviewed main-side additions/fixes |
| `.github/workflows/cli-setup.yml` | Byte-identical |
| `tests/tooling/ci-plan.test.mjs` | Byte-identical |
| `tools/ci/plan.mjs` | Byte-identical |
