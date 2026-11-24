# ClassRup — durable non-final owner retirement acceptance (2026-11-23)

Parent draft #150 4432d67a683c0fe18c4baca372524c7e03ae27d3, tree e798de05a2a6e3d1f820c1dbe06cd9d02a6ccd55. Main observed 449a619f1ae7b66cb42d9cab43dd5493bfe42c2e (full registry recovery #63). #57 merged 137d88e36cc6b1611b062daa33cf84c3d29c86b3. Current open inventory: #150 newest; long stacked drafts and alternative roots remain. No ancestor changes. Native git ls-remote failed exit 128 (Could not resolve host: github.com); no native worktrees or local product tests. Git object publication only.

## Bounded test-only milestone
Extend the executed #150 memory lifecycle scenario to an encrypted IndexedDB vault through a fresh lock/open/unlock. Verify principal, retained bytes and holder count BEFORE any repair/reimport, prove current and unmanaged holder labels survived and stale label was retired, then verify retirement can be repeated after reopening. Retain the existing memory test. No production runtime change, final deletion, private/source-encrypted import, signing identity, v1 format, crypto, limits or timeouts change. fake-indexeddb integration is not native hardware/browser interruption acceptance. New test not executed locally.

## Exact qualification
Parent Alpha 45264062462 completed CANCELLED: plan passed; domain job 138006331304 typecheck, spec/deps/registry, money vectors/budget, tooling, domain, setup and build steps passed; browser journeys cancelled, not a full Alpha pass. CLI 45264062451 succeeded (Ubuntu Node 22/24 jobs, actual dev/prod smoke steps passed). Zero submitted reviews. Original cancellation preserved; no unchanged rerun. New test changes the source and requires its own CI, without retroactively qualifying parent. #57 local exit 137 and #56 main-push Alpha cancellation/CLI success preserved. Initial and relevant later handoffs inspected; exhaustive historical reread not completed.

## Independent lanes still unassigned/unexecuted
- Code audit: verify exact child SHA/tree, test assertions before any repair, durable journal/reopen and holder identity semantics; audit root integration order separately.
- Functional bug hunt: execute new reopen regression and existing memory/rollback/import tests serially; add late persistence rejection acceptance with a controlled persist callback, demonstrate unchanged bytes and holder labels, then retry. Separate simulated working-set persistence failures from real IDB aborts.
- Defensive security: source-only review of canonical authority, non-final retention, destination-local encryption, fail-closed error and lock handling. No interrupted reproduction follow-ups. Record exact source and test evidence; no self-approval as independent review.

Next: resolve parent browser cancellation based on evidence/concrete changed conditions; obtain genuine independent reviews; qualify ancestors and merge only permitted candidates in order, verify actual merge tree and main push. Continue late-persist rollback acceptance, then explicit deleted-parent/final-retention and private destination-key contracts. No release, deployment, force push, branch deletion or paid API.
