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


---

## Rotation 2 — 2026-11-10, outbox dispatcher source review (sequential, read-only)

- **Source:** draft PR #10, exact SHA `429fcfca9735a323a6ce709d8605429d6c850fdb`; audit ledger prior branch head `8653938687bf8c4a6a4624c025b872e096189a65`. No source changed. This was a **sequential** review, not a second concurrent worker.
- **Reproducible selection:** FNV-1a 32-bit over ASCII seed `429fcfca9735a323a6ce709d8605429d6c850fdb|8653938687bf8c4a6a4624c025b872e096189a65|audit-rotation-2`, yielding `260780115`. Candidate set: 80 lexicographically sorted `.ts/.tsx/.mjs/.js` source blobs in current commit tree, excluding `tests/`, filenames with `.test./.spec.` and the prior audited `packages/kernel/src/observability/redact.ts`. Index `35 / 80` selected `packages/kernel/src/outbox/dispatcher.ts`.
- **Surrounding paths reviewed:** `packages/kernel/src/outbox/backoff.ts`, `packages/kernel/src/outbox/dispatcher.test.ts`, `packages/kernel/src/sync/sender.ts`, `packages/kernel/src/storage/tx.ts`, `packages/kernel/src/storage/storage.ts`, `packages/kernel/src/testing/harness.ts`; applicable [CTR-EVT-001](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/contracts/CTR-EVT-001.md) EVT-2/3/6/8 and [ADR-0016](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/429fcfca9735a323a6ce709d8605429d6c850fdb/planning/adr/ADR-0016.md). Source and tests were read, not run.

### A-003 — Cross-tenant same-ID retry can defer an unrelated aggregate (conditional correctness finding)

**Observed control path:** `packages/kernel/src/outbox/dispatcher.ts:68-80` groups all pending events using **only** `env.aggregate.id`. `runSubscriber` reads subscriber-pending events at :170, then at :172-175 uses the same `aggregate.id` as the blocked-set key after a retry or feature pause. The key does **not** include `tenantId` or `aggregate.type`. Existing `dispatcher.test.ts:23-60` covers delivery, retries, deduplication and one aggregate but does not exercise two tenants/types with deliberately identical aggregate IDs.

**Concrete code-path proof (conditional on colliding IDs):** The same subscribed consumer receives two valid pending events in one batch: `tenant A / type listing / aggregate ID X` followed by `tenant B / type listing / aggregate ID X`. A handler retry for the first event adds `X` to `blocked`; the second event is skipped before `deliverTo` despite being a different tenant's aggregate. A later pass can deliver it, so this is a **delay/starvation-under-retry**, not proven message loss or a bypass of authorization. The separate `orderBatch` mapping also intermixes those keys and deserves a scoped test.

**Impact / conditions:** A legitimate multi-tenant consumer seeing two tenants reuse one aggregate ID can have one tenant's messages delayed by another tenant's failing/disabled event; severity **low**, confidence **high in the conditional source flow**, **runtime replay not yet executed**. This is not established as a production incident or an externally exploitable vulnerability. Globally random UUIDs make accidental collisions unlikely; deliberate shared IDs or reimported aggregate streams remain a question for the contract owner.

**Regression / minimal proposal:** On a *new isolated test branch after confirming Stage 3/4 ownership*, register one consumer for two tenants with the same aggregate ID. Make tenant A's first handler retry, assert tenant B still delivers in the same pass; also ensure revisions for the *same* `(tenantId, aggregate.type, aggregate.id)` remain ordered and blocked on retry. If accepted, replace group and blocked keys with a collision-safe typed tuple without changing event envelopes, storage schema, retry policy, or delivery guarantees. Do not edit the currently owned Stage 3/4 code until integration ownership is settled.

**Audit limits:** no production/event-bus test was executed, no fuzzing, no source patch and no claim of general outbox correctness. Prior finding A-001 on diagnostics remains open and owner-coordinated; no exploit details were publicly filed. Next rotation should use a new seed with this updated ledger head and exclude both previously audited starting paths.
