# BlindMatch — P1 implementation and acceptance register

Status: planned. P1 means high priority for development, not permission to bypass security dependencies or claim implementation. Begin with the independent foundation slice while existing consolidation continues. Each slice is independently reviewable; use isolated branches, fresh workers if needed and documented handoffs. No implementation or production dependency selected by this document.

| Slice | Dependencies | Deliverable / acceptance gate | Priority |
|---|---|---|---|
| BM-A | Existing architecture/catalog | Reconcile ownership; canonical module specs, process docs, DAG, generated artifacts, explicit threat model and no duplicate ownership; spec/deps/registry checks pass | P1 |
| BM-B | A, vault codecs | Private intent CRUD, validation, revision/expiry, encrypted persistence; legacy restore and mixed-record restore pass; unknown/malformed records quarantined; no public projection | P1 |
| BM-C | A/B, consent and identity | Scope, purpose, recipients, version, expiry, revocation, lock checks; unauthorized actor and stale revision rejected; revoke survives backup and replay | P1 |
| BM-D | B/C | Local matching against authorized public inputs; deterministic results match an independent oracle on bounded synthetic fixtures; mobile UI; no network call in local-only workflow | P1 |
| BM-E | C/D, reviewed protocol decision | Bilateral confidential matching using established PSI/MPC or appropriate audited provider; protocol test vectors, independent review, malformed input and unauthorized output rejected, documented leakage | P1 |
| BM-F | E, money contract | Exact confidential same-currency price-overlap; equal boundary accepted, reversed/negative/overflow/mismatched currency rejected; no reserve or max disclosed | P1 |
| BM-G | E/F, canonical barter and reservations | Confidential 2/3/4-party feasibility, independent small-graph oracle, distinct owners/assets, dropout/stale/blocked/duplicate handling; proposal only after all required consents | P1 |
| BM-H | D–G | Mixed cash/barter, pinned conversion and versioned scoring; exact arithmetic vectors; no implicit payment or hold | P1 follow-on |
| BM-I | E–H | Optional FHE provider evaluation and bounded N-party research; benchmark, independent threat/security/license assessment, approval before activation | P1 research; gated runtime |
| BM-J | D and corresponding owning domains | Credentials, services/rentals/auctions/group purchase adapters; separate authorization and qualification | P2 follow-on |
| BM-K | Existing commerce/recovery, separate approval | Optional noncustodial settlement and fee policy; no double charge; failure/recovery and evidence acceptance | P2; not authorized to activate |

## Independent acceptance matrix

- BM-T01: Create/edit/pause/archive private have/want records in two synthetic vaults. Confirm no cross-vault access and no private row appears in public signed-file export, relay payload, browser URL, service worker cache, logs or content-bearing notifications.
- BM-T02: Lock, hide, switch vault, cancel and revoke while a job is in flight. Late responses cannot render, create a suggestion or disclose data. Revocation and existing evidence survive encrypted backup/restore.
- BM-T03: Same job intent and identical revision replay safely; reused idempotency key with different scope/input fails. Concurrent tabs cannot create duplicate proposal/notification for the same accepted intent. Simulated interruption shows unknown until reconciled or expired.
- BM-T04: Exact minor-unit boundary vectors (buyer max below/equal/above min; zero; max supported amount; invalid encoding, precision, currency, quote). Compare with an independent bigint oracle. No hidden amount/score in outputs or errors by default.
- BM-T05: Bilateral positive/negative hard constraints and bilateral authorization. Only permitted result fields leave the protocol; malformed, expired, replayed, wrong-purpose and invalid evidence fail closed. Tests use synthetic data and local/staging fixtures only.
- BM-T06: For 2/3/4-node graphs compare all bounded suggestions with independent exhaustive small-graph oracle; check duplicate owners/assets, disconnected graphs, multiple valid cycles, deterministic tie order, unavailable item and conflicting reservation. No automatic execution.
- BM-T07: Decline, block, revoke, timeout or material revision at each disclosure step. No new disclosure after revocation; only explicit approved fields appear in an introduction. All-party consent required for proposal terms; canonical trade lifecycle remains independent.
- BM-T08: Provider disabled/unreachable, malformed response, wrong provider/version or unavailable key authority. Confidential mode fails closed and never sends plaintext as a fallback; public/local workflows continue normally.
- BM-T09: Establish authorized query budgets and evaluate cumulative output leakage, abusive repeated queries and Sybil limitations with independent review. No unlimited arbitrary comparisons or private reason codes. Test blocking/reporting and abuse controls with synthetic actors.
- BM-T10: Backup/restore with legacy archives, new codec types, corruption, omitted records, revocation, pending jobs and account switch. No recovered job resumes automatically; no record silently lost. Check migration rollback and unknown-module quarantine.
- BM-T11: Qualify on Chromium, Firefox, WebKit and supported real mobile targets. Define measured candidate/batch limits, memory, latency and cancellation budgets before activation; enforce limits, collect evidence at actual maximum workloads. No weakening existing matching-worker bounds or accessibility checks.
- BM-T12: Verify keyboard/screen-reader flow, localization, exact currency formatting and responsive UI; users can distinguish local, public and confidential modes, unavailable/unknown states, introduction and execution. Manual checks supplement automated browser tests.
- BM-T13: Run existing typecheck, spec:check, deps:check, registry:check, domain, CLI/tooling, build and browser gates on exact candidate. Preserve prior alpha flows and signed-file interoperability. Independent light QA and bounded robustness tests after each slice; independent cryptography review before confidential mode release.
- BM-T14: No provider dependency, license obligation, chain deployment, paid feature, custody, or runtime activation without documented decision and explicit approval. Check flag-off behavior, migration, rollback and ordinary workflows.

## Worker handoff instructions

For each slice, inspect latest main and active PRs first, claim only non-overlapping work, reuse owning domain contracts, implement the smallest independently useful change, add failing acceptance tests before fixes where applicable, and record evidence at the exact candidate SHA. Do not invent cryptography, replace existing controls with mocks, loosen tests, or mark a slice complete on source presence alone. Review and merge only after normal repository gates and active integration coordination. If a dependency is blocked, record it and continue a safe independent P1 slice. All protocol/security experiments use synthetic data and isolated local or explicitly authorized test environments.
