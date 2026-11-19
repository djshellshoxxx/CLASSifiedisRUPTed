# Local qualification failure triage

This is a static review of existing logs and source. No new test or browser execution was started by this reviewer during triage.

## Initial local run

| Gate | Observed outcome | Evidence-based interpretation |
| --- | --- | --- |
| Typecheck | Exit 137 after 57.71 seconds; log says Killed, with no TypeScript diagnostic | Process was killed, consistent with SIGKILL. Memory exhaustion is plausible under concurrent validation but is not proved by the log alone. |
| CLI | 31 passed, 1 failed, 0 skipped | The sole failure is a spawnSync ETIMEDOUT, not a semantic record-verification assertion mismatch. |
| Tooling | 23 passed plus one file-level failure; 24 reported tests | tests/tooling/status.test.mjs failed as a child after about 71.2 seconds. No inner assertion, signal, or child exit code was printed. Exact cause remains unknown. |
| Initial domain suite | Log contains launch command only; no completed JSON report was available at review | Incomplete/unsuccessful attempt; no executed assertion count or pass is established. |
| Pinned browser installation | Repeated download output reports 0 MiB; ZIP central-directory signature missing; install exits with code 1 | Invalid/truncated/non-ZIP download, before browser test execution. Network or server root cause is not established by the log. |

Source references: evidence/local-checks/checks.json, typecheck.log, cli.log, tooling.log; evidence/domain.log; evidence/browser-install.log.

### Exact CLI signal

The failure is the test at tests/cli/records.test.mjs:128, “subprocess rejects tampering, wrong CID, invalid signature and unknown envelope fields.”

Its helper at line 66 calls spawnSync with timeout: 15000. The assertion at line 69 expects result.error to be undefined. Actual result.error is ETIMEDOUT (errno -110), and the failing test took 15,662.76 ms. The log does not show a successfully completed child accepting an invalid record, reporting an incorrect exit code or leaking input. The timed-out loop fixture cannot be identified from the log because the cases reuse one filename.

The compiler error about “this is invalid typescript !” is intentional input in the passing test “build failure preserves prior output and successful build removes stale assets”; it is not a second failing CLI case.

### Tooling evidence limit

status.test.mjs defines four assertions/tests. None was individually reported in this failed child run. The parent runner reports the failed file as one test, explaining the initial count of 24 (23 other tests passed plus one failed file) versus the expected full tooling count of 27.

There is no explicit test timeout in status.test.mjs, and its only spawnSync invocation has no timeout option. The file repeatedly loads the specification catalog and invokes status/trace scans. This can contribute to resource pressure, but that is a hypothesis. The terse file-level message alone does not prove a timeout, OOM, signal, or source assertion failure.

The reviewed files tests/tooling/status.test.mjs, tools/status/status.mjs and tests/cli/records.test.mjs have no diff between candidate d81094688ac116c84c09f3105c7b3f6b4c472793 and the local integration head.

### Retry status at inspection

evidence/domain-serial.log contains the --maxWorkers=1 launch command, with output planned for evidence/domain-serial.json. evidence/local-checks/typecheck-retry.log contains the typecheck launch command. At inspection neither file provided a completed result; their eventual outcomes must be recorded separately.

## Recommended validation handling

Retain all initial unsuccessful attempts. Retry the affected gates sequentially using the existing assertions/timeouts, bounded worker counts and the root agent's heap budget. Record retry outcomes at the actual source. Do not increase the 15-second CLI subprocess timeout or alter assertions based only on host contention.

Treat installed system Chromium as supplementary compatibility/smoke evidence if used. It does not replace qualification with the pinned Playwright Chromium/Firefox/WebKit versions. Fresh hosted integration CI remains the final platform/browser evidence.

## Archived review portability

At inspection, docs/development/evidence/20261118/pr53-adversarial.mjs still imported ../../classrupted/tools/cli/records.mjs. That path was correct for its original scratch evidence location but is wrong after copying into the repository. The archived import should be ../../../../tools/cli/records.mjs.

The original command in pr53-review.md is a historical execution command. Keep it labeled historical, and add the archive reproduction command from repository root:

    node --test docs/development/evidence/20261118/pr53-adversarial.mjs

Relative Markdown links to the sibling pr53-adversarial.mjs and pr53-adversarial-results.txt are portable in the archive. Only the archive import relocation is needed; no test assertions or production code need changing.

