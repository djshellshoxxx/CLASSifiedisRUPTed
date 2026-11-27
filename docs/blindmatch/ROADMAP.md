# BlindMatch — P1 implementation and acceptance register

Status: bounded local foundation implemented and disabled; authenticated adapter
and view continuation under qualification. The broader confidential family remains
future work. BlindMatch is the flagship; LocalBazaar and LocalMutiny are subsequent
products. P1 does not bypass existing safety dependencies or authorize activation.
Use isolated branches and source-specific handoffs. See the
[November 27 analysis](../development/cycles/20261127-blindmatch-view/ANALYSIS.md)
for current heads, completed code and unavailable execution evidence.

| Slice | Dependencies | Deliverable / acceptance gate | Current disposition |
|---|---|---|---|
| BM-A | Existing architecture/catalog | Canonical ownership, process docs, DAG and generated artifacts; spec/deps/registry checks | F19 / PS-149 / PS-150 defined; 19 features / 150 modules catalogued. Broader future modules still need their own specifications. |
| BM-B | A, vault codecs | Owner-private intent CRUD, revisions/expiry, encrypted persistence, strict erasure, legacy and mixed-record restore, no public projection | Bounded local implementation in #169; unknown/malformed records fail closed. Full inventory/profile extensions and quarantine UI are future work. |
| BM-C | A/B, consent and identity | Cross-party purpose/field/recipient/revision binding, explicit disclosure, revocation and recovery; retention compatible with owner erasure | Future P1 work. Local session opt-in is not cross-party consent and does not complete this slice. |
| BM-D local | B, current unlocked session | Authenticate retained public inputs; deterministic bounded matching; no network; editor/results, cancellation and recovery; native/mobile/a11y qualification | Matcher foundation exists; authenticated adapter implemented; view continuation under qualification. Main launch gate remains false. |
| BM-D disclosure | C and corresponding owning domains | Any introduction, contact, external proposal or disclosure must use current explicit authorizations | Future work. Not required for the isolated public-cache local path, which performs none of these actions. |
| BM-E | C/D, reviewed protocol decision | Bilateral confidential matching using established PSI/MPC or qualified provider; real protocol vectors and independent review; documented leakage | Future P1; no protocol/provider selected or activated. |
| BM-F | E, money contract | Confidential same-currency price overlap; exact boundaries, currency/precision admission, no reserve/max disclosure | Future P1. Existing local public-price filtering is not this protocol. |
| BM-G | E/F, canonical barter and reservations | Confidential 2/3/4-party feasibility; independent oracle; distinct owners/assets; dropout/stale/blocked/duplicate handling; explicit proposal consent | Future P1; LocalMutiny product release remains later. |
| BM-H | D–G | Mixed cash/barter, pinned conversion and versioned scoring; no implicit payment or hold | Future P1 follow-on. |
| BM-I | E–H | Optional FHE and bounded N-party evaluation; independent protocol, threat, performance and license review | Future research; runtime gated. |
| BM-J | D and owning domains | Credentials, services/rentals/auctions/group purchase adapters; separate authorization and qualification | Future P2. |
| BM-K | Existing commerce/recovery, separate decision | Optional noncustodial settlement and fee policy; no double charge; failure/recovery and evidence acceptance | Future P2; activation not authorized. |

The canonical local PS-149/PS-150 contracts govern implemented behavior. Local
matching has no persisted job, result, idempotency hash, audit/event record or
identifying deletion history. Future external-side-effect replay and revocation
designs must satisfy owner erasure before being implemented. They cannot borrow
a retained-history requirement from this roadmap to override `RET-OWNER-LIVE`.

## Independent acceptance matrix

- BM-T01: Current local slice: create/edit/pause/erase private intents in two synthetic vaults. Verify owner isolation, erasure without identifying history, and no private content in public exports, network payloads, URLs, service worker cache, logs or notifications. Have/want inventory extensions require their own future cases.
- BM-T02: Lock, hide, switch vault, cancel and disable while local matching is in flight. Late responses cannot render or refill private fields. Restore intent content as draft with no recovered job/result. Future external revocation and evidence recovery require a separately reviewed erasure-compatible contract.
- BM-T03: Current local slice: optimistic revision conflicts and ephemeral epoch/session checks reject stale actions without a persisted replay cache; repeated erase reports absence. Future externally effectful proposals/notifications need duplicate-prevention and unknown-outcome acceptance after their authority and retention designs are approved. Do not add intent-derived hashes or retained identifying history to satisfy this future gate.
- BM-T04: Exact minor-unit boundary vectors (buyer max below/equal/above min; zero; max supported amount; invalid encoding, precision, currency, quote). Compare with an independent bigint oracle. No hidden amount/score in outputs or errors by default.
- BM-T05: Bilateral positive/negative hard constraints and bilateral authorization. Only permitted result fields leave the protocol; malformed, expired, replayed, wrong-purpose and invalid evidence fail closed. Tests use synthetic data and local/staging fixtures only.
- BM-T06: For 2/3/4-node graphs compare all bounded suggestions with independent exhaustive small-graph oracle; check duplicate owners/assets, disconnected graphs, multiple valid cycles, deterministic tie order, unavailable item and conflicting reservation. No automatic execution.
- BM-T07: Decline, block, revoke, timeout or material revision at each disclosure step. No new disclosure after revocation; only explicit approved fields appear in an introduction. All-party consent required for proposal terms; canonical trade lifecycle remains independent.
- BM-T08: Provider disabled/unreachable, malformed response, wrong provider/version or unavailable key authority. Confidential mode fails closed and never sends plaintext as a fallback; public/local workflows continue normally.
- BM-T09: Establish authorized query budgets and evaluate cumulative output leakage, abusive repeated queries and Sybil limitations with independent review. No unlimited arbitrary comparisons or private reason codes. Test blocking/reporting and abuse controls with synthetic actors.
- BM-T10: Current local slice: legacy and full sixteen-codec recovery, corrupt/unknown/malformed admission, inactive intent restoration, erasure/reopen and account switch. No job/result is backed up or resumed. Future external authorization/revocation recovery and quarantine require separate codec, retention and rollback acceptance; unknown records must never be silently omitted.
- BM-T11: Qualify on Chromium, Firefox, WebKit and supported real mobile targets. Define measured candidate/batch limits, memory, latency and cancellation budgets before activation; enforce limits, collect evidence at actual maximum workloads. No weakening existing matching-worker bounds or accessibility checks.
- BM-T12: Verify keyboard/screen-reader flow, localization, exact currency formatting and responsive UI; users can distinguish local, public and confidential modes, unavailable/unknown states, introduction and execution. Manual checks supplement automated browser tests.
- BM-T13: Run existing typecheck, spec:check, deps:check, registry:check, domain, CLI/tooling, build and browser gates on exact candidate. Preserve prior alpha flows and signed-file interoperability. Independent light QA and bounded robustness tests after each slice; independent cryptography review before confidential mode release.
- BM-T14: No provider dependency, license obligation, chain deployment, paid feature, custody, or runtime activation without documented decision and explicit approval. Check flag-off behavior, migration, rollback and ordinary workflows.

## Worker handoff instructions

For each slice, inspect latest main and active PRs first, claim only non-overlapping work, reuse owning domain contracts, implement the smallest independently useful change, add failing acceptance tests before fixes where applicable, and record evidence at the exact candidate SHA. Do not invent cryptography, replace existing controls with mocks, loosen tests, or mark a slice complete on source presence alone. Review and merge only after normal repository gates and active integration coordination. If a dependency is blocked, record it and continue a safe independent P1 slice. All protocol/security experiments use synthetic data and isolated local or explicitly authorized test environments.
