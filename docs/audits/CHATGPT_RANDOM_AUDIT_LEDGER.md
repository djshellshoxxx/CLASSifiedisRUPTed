# ClassRup randomized independent audit ledger

Run date: 2026-11-10 UTC. **Read-only code review of another contributor's unmerged implementation; this report is a separate sequential audit phase, NOT a second concurrent worker.**

## Reproducible selection and evidence

- Source under audit: PR [#10](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10) at `429fcfca9735a323a6ce709d8605429d6c850fdb` (draft, not merged). Default `main`: `95c46be41233520382566360e7135011412e8e6e` (planning-only). No prior `docs/audits/CHATGPT_RANDOM_AUDIT_LEDGER.md` was found in the inspected main/alpha tree.
- Candidate list: 78 lexicographically sorted `.ts/.tsx/.mjs/.js` source paths at this SHA, excluding `tests/`, `.test.` and `.spec.`. Seed: 32-bit FNV-1a of `<SHA>|no-previous-ledger`, unsigned result **661952260**; index **34 / 78**, selecting `packages/kernel/src/observability/redact.ts`. Next run should use this ledger in the selection seed and prefer a different path.
- Scope read: `packages/kernel/src/observability/redact.ts`, `ip.ts`, `logger.ts`, `logger.test.ts`, `redact.test.ts`, `metrics.ts`, `readiness.ts`; callers via `packages/kernel/src/testing/harness.ts` and exports via `packages/kernel/src/index.ts`; trust requirements [CTR-OBS-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-OBS-001.md) and [CTR-PRV-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-PRV-001.md). Existing tests checked for expectations, not executed here.

## Verified source-boundary findings (not confirmed production exploitation)

### A-001: Freeform diagnostic text bypasses field redaction

**Source and proof:** `packages/kernel/src/observability/logger.ts:30-33` calls `redact(fields)`, then inserts the caller-supplied `msg` unchanged into the JSON record. `packages/kernel/src/observability/redact.ts:39-45` retains the error's freeform message and first eight raw stack lines; its `redactString` truncates only a string that is *entirely* an IP literal, not identifying text embedded in a sentence. Existing `redact.test.ts:17-19` explicitly expects the embedded synthetic IPv4 literal to survive. The `consoleSink` and user-exportable `RingBufferSink` demonstrate the potential output surfaces.

**Consequence:** If an application/relay caller includes private fields in a log message or error text, those bytes can remain in output despite the structured-field filters. A bounded local ring does not remove this at export time. This is a **deterministic code-path gap** against the stated OBS-1 / PRV privacy intent, but **no actual production caller transmitting private data was established** in this review. No secrets or real user data were accessed.

**Suggested non-sensitive regression:** create a logger with a capture sink; emit a structured event whose freeform text includes a harmless synthetic private identifier; assert output cannot contain it. Also cover a nested synthetic Error whose stack text includes such a value. Preserve event codes, correlation metadata, and useful non-sensitive debugging. Confirm that the remediation covers all log sinks, not just one. Current tests only assert sensitive fields disappear from structured objects.

**Confidence:** high for the source behavior; production exposure unproven. **Severity:** medium *conditional on untrusted/private diagnostic text reaching a sink*, not a confirmed shipped vulnerability. Don't describe the entire logger as a guarantee of privacy before fixing the boundary.

**Ownership/remediation status:** **UNFIXED.** The code originated in the Stage 3/4 foundation on draft PR #8; PR #10 does not change these observability paths. To avoid altering another active owner's files, this audit did **not** add regression tests or code changes. Primary integrator should coordinate file ownership before opening a separate test-first fix PR based on the alpha branch. Treat any eventual change to the permitted log-message contract as an explicit interface/security decision, not an undocumented rewrite.

### A-002: Metrics and readiness preliminary review

The inspected metrics registry constrains metric label names; no additional reproducible defect was established from the inspected fragments. No correctness or secrecy guarantee is inferred from this partial review; inspect its callsites and series cardinality in a later independently selected audit. This is **not** a finding.

## Validation, branch isolation, next steps

- Static cross-file read and source-line checks **completed**; source has not been modified. No runtime reproduction, unit test, GitHub Actions run, PWA test, threat emulation or separate subagent was executed for this audit.
- This report is on `chatgpt/zero-codex/audit-observability-20261110` against planning-only main; code references are pinned to PR #10's exact commit to avoid misrepresenting main as containing the alpha code.
- Next audit: recompute source candidates using the current alpha commit plus this ledger, rotate to a previously unaudited path, and inspect its callers/tests and the applicable privacy/trust contracts. Independently follow up on A-001 with an owner-coordinated regression test and minimal fix. Do not publicly file exploitable details or use real private data in diagnostics.

No branches merged, no security gate weakened, no release or deployment.
