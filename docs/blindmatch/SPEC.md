# BlindMatch — confidential economic discovery

**Owner priority: P1 (high). Status: approved direction, planned; no runtime implementation or cryptographic qualification claimed.** 2026-11-26.

BlindMatch is an optional cross-domain feature family for LocalBazaar and LocalMutiny, extending later to services, rentals, auctions and group purchasing. It discovers mutually beneficial commerce opportunities using preferences that participants need not publish. A match is an invitation, not consent to trade, a reservation, a payment or evidence of physical delivery.

See [architecture and user-flow diagrams](DIAGRAMS.md) and [implementation and acceptance roadmap](ROADMAP.md).

## BM-01 — Scope and product requirements

- Private wanted lists and hidden inventory: owner-only until explicitly authorized for a defined matching session. Opt-in per item, field, purpose, provider, duration and audience; private is default. A hidden item never becomes a public listing because of a match.
- Bilateral matching: compatible item/category, condition, quantity, coarse location, availability, currency, price limits and deal breakers. Hard constraints must all pass; optional preferences can rank eligible candidates locally. No score or rejected constraint about another person is exposed by default.
- Blind price discovery: seller minimum and buyer maximum remain private; reveal only an authorized compatibility outcome. An overlap does not set a price. Explicitly agreed negotiation rules may produce a proposal, not a binding transaction. Never automatically disclose either limit, range width, midpoint or inferred valuation.
- LocalMutiny: suggest two-party and bounded 3–4-party cycles initially; N-party search only after separate resource and privacy qualification. Each distinct owner gives an available item and receives an eligible item. Cash adjustments and FX use exact money and pinned quotes with explicit approval. No secret preferences are exported into the existing public graph.
- Progressive disclosure: mutual opt-in before showing a limited introduction; separate explicit consent for concrete terms, contact details, meetup information and execution. Each material revision invalidates earlier consents.
- User controls: pause, cancel, block, report, revoke, delete, export, backup/restore, provider selection, expiry and explanation of own rules. Content-free notifications by default; lock or account switch conceals private results.
- Accessibility: mobile-first, keyboard/screen-reader support, readable failure states, no color-only meaning, no wallet or remote service required for local functions.
- Later extensions: private procurement bids/reserves, service and rental availability, cooperative purchasing, verified credentials, portable reputation and optional noncustodial settlement. Do not block the first useful slice on these.

## BM-02 — Existing architecture and dependency boundaries

The [project specification](../../PROJECT_SPEC.md), ADR-0016, [barter alpha](../../docs/BARTER_ALPHA.md), [vault boundaries](../../packages/vault/README.md), [federation boundaries](../../packages/federation/README.md), and [remaining work](../development/REMAINING_WORK.md) are authoritative for existing contracts. The current alpha has encrypted IndexedDB domain rows, Ed25519 identity, deterministic bounded barter enumeration, worker cancellation, exact-money library, signed alpha coordination, local inbox and opt-in consent/catalog foundations. Canonical device recovery, full consent composition, canonical federation and full physical-exchange recovery remain incomplete.

BlindMatch owns private profiles, explicit matching authorizations, jobs, candidate suggestions and local disclosure records. Existing domains retain ownership of listing revisions/availability, identity/key validity, money/currency, consent, trade proposals, holds, receipts, messaging, moderation and retention. Use versioned ports and authenticated domain handlers, not direct cross-package storage reads. The existing public matching engine remains unchanged for public data; use its deterministic pure rules or adapters only when compatible with the new privacy boundary. Existing signed-file bytes, IDs and backups must remain compatible. New records use reviewed codecs and migrations; unknown records are quarantined, not silently discarded.

No new F19 ID is assigned here: the generated catalog currently has 18 features and 148 modules. During foundation implementation, reconcile module ownership against planning/modules.yaml, add canonical module specs and required process documents, validate dependency DAG and regenerate catalog/index using existing tooling. Avoid duplicate module ownership. Development priority P1 does not imply runtime enablement; runtime flag defaults OFF until gates pass. Feature disablement must not delete recovery evidence or break ordinary classifieds and barter.

## BM-03 — Trust model and supported modes

| Mode | Computation | Allowed claims |
|---|---|---|
| Local | User's unlocked vault, public signed listings or owner-authorized local data | Owner preferences stay local; no private cross-user computation claim |
| Bilateral confidential | Independently reviewed PSI or MPC provider/protocol for a bounded authorized predicate | Only qualified leakage and adversary model; intersection cardinality or elements only if explicitly authorized |
| Advanced confidential | Optional reviewed FHE/MPC provider for limited predicates, exact comparisons and weighted scoring | Confidential inputs within documented key/access/metadata assumptions, not anonymity |
| Public matching | Existing engine | Public data only, clearly labeled; never fallback from confidential mode |

Static PWA code distribution, endpoints, users, peers, relays, providers, credential issuers and key authorities are separate trust boundaries. An encrypted-at-rest local record is not an encrypted-computation proof. A signature proves an assertion, not actual ownership or delivery. A worker is a scheduling boundary, not isolation from malicious same-origin code.

Provider selection requires a threat model, protocol/library review, supported security level and malicious-party assumptions, key lifecycle, authorization, result integrity, metadata disclosure, availability, portability, performance and commercial licensing review. Use established implementations; do not invent primitives or silently replace them with hashing, plaintext services or mocked production adapters. Low-entropy category hashes are not private set intersection. FHEVM (https://github.com/zama-ai/fhevm) is a candidate, not a dependency decision: its host-chain metadata, coprocessor, gateway, decryption authority, asynchronous availability and licensing need separate approval. No blockchain or paid provider is mandatory. No raw preferences, coordinates, stable personal identifiers or decryptable personal datasets on public chains. Prefer off-chain ephemeral computation. ZK proofs attest only to specified predicates over authenticated inputs, not real-world truth.

## BM-04 — Proposed contracts (design, not frozen wire format)

Use existing versioned command/query/event conventions and capability checks. The following record roles are conceptual; implementation must map them to canonical IDs, validation, exact money and existing codecs.

| Record | Required content / boundary |
|---|---|
| PrivateIntent | owner, local id, revision, kind (have/want/buy/sell), item constraints, private valuation/budget, region bucket, availability, hard/soft rules, expiry; encrypted owner-only |
| MatchAuthorization | owner, purpose, allowed fields and outputs, mode/provider, audience, scope, immutable intent revision binding, expiry, revocation state; owner-signed when crossing a trust boundary |
| MatchJob | opaque job id, authorization references, input commitments where appropriate, protocol/policy versions, deadline, stable idempotency key, status; locally encrypted |
| MatchSuggestion | job binding, authorized minimal outcome, expiry, permitted own-rule explanation, evidence basis, revision bindings; owner-scoped, no raw peer profile |
| DisclosureGrant | specific fields, recipients, match and revision binding, expiry, explicit confirmation; revocable prospectively |
| TradeProposalRef | canonical proposal identifier/revision and evidence link; existing barter/commerce domain owns terms and lifecycle |

Proposed operations: create/update/archive intent; authorize/revoke matching; start/cancel job; list suggestions with bounded pagination; view own explanation; accept/decline introduction; approve/revoke disclosure; request canonical trade proposal. Read and write operations must enforce owner scope, current key validity, feature gate, lock state, validated revision and capability. Events are local and content-minimal; cross-party records are explicitly authorized, versioned and authenticated. No plaintext fields in URLs, logs, push messages or public projections.

Provider boundary: typed validated request plus context and cancellation; return pending, verified eligible, verified ineligible, failed, cancelled or unknown, with protocol/version and evidence sufficient for the selected mode. Eligibility can be accepted only if evidence binds to current authorizations, input versions, purpose, nonce/session and expiry under the reviewed verification mechanism. Unsupported security capabilities fail closed. No silent downgrade. A generic provider signature is not proof of correct computation. Public errors use existing kernel conventions; do not disclose the rejected peer constraint. Unknown outcome never implies no match or permits unbounded replay.

## BM-05 — Matching semantics

Bilateral eligibility = both sides' hard constraints satisfied AND both authorizations current AND compatible listing/intent revisions AND neither participant blocked. For price overlap, require same exact currency binding and validated nonnegative integer minor units before comparing buyer maximum >= seller minimum. Missing currency/unsupported precision/stale quote is ineligible for computation, not coerced to a default. Cross-currency matching waits for explicit pinned-quote policy. Private numerical scoring is not exposed as public evidence. No automatic midpoint.

A cycle is a directed set of distinct participants and assets with one compatible outgoing and incoming leg per participant. Apply all hard constraints and current availability before scoring. Preserve deterministic tie rules and stable ordering for identical authorized snapshots. Bound graph size, candidate count, search time and memory. Revalidate all canonical asset revisions and availability before producing a proposal. No match may imply a hold. Dropout, conflicting holds, stale evidence or material revision freeze or invalidate the suggestion; never silently reroute. All-party consent remains mandatory for execution. Matching cannot make physical goods exchange atomic.

## BM-06 — Lifecycle, privacy and recovery

See diagrams for transitions. Private intent may be drafted, activated, paused, expired, revoked or archived. Job states are queued, running, verified result, failed, cancelled, expired or unknown; a stale result is rejected even when it arrives after cancellation/lock/restore. A suggestion is pending introduction, declined/expired/revoked, mutually accepted, or handed off to a canonical proposal. No automatic execution. Record signed revisions and monotonic revocation evidence, validate on restore, and reconcile uncertain jobs before retry. Use stable intent-derived idempotency keys and atomic local claims: same key/same input replays safe state; changed input conflicts; no duplicate proposals/notifications. Retain dedupe evidence for the approved replay horizon. Lock, account switch and feature disable cancel active work, invalidate callbacks and conceal UI. Offline local matching remains available; remote jobs show unavailable or pending, never a fabricated result.

Threats and controls:
- Unauthorized reads, malicious peers or provider compromise: minimum output, current capabilities, independently reviewed trust assumptions, strict scope and validation; no provider receives raw private preferences in qualified confidential modes.
- Preference inference from repeated matches: bounded authorized attempts per scope, meaningful consent to new queries, abuse controls, coarse/minimal output, no unlimited arbitrary comparison oracle; assess cumulative output leakage and Sybil limitations before release.
- Metadata and linkability: document network endpoints, timing, ciphertext sizes, public buckets, identities and observable access patterns. Do not promise anonymity; preserve safe transport choices without requiring anonymity networks. Coarse location only by default, exact meetup details explicitly shared separately.
- Integrity and replay: bind versions/expiry/purpose, reject invalid ciphertext/proof, stale and duplicate responses, enforce independent verification; adversarial input limits and fail-closed parsers.
- Abuse: opt-in only; block/report and appeal support, user-visible scope, anti-spam limits, no unsolicited contact or automatic identity disclosure. Marketplace safety policies remain applicable. No arbitrary personal profiling or discriminatory high-stakes matching.
- Data lifecycle: encrypted owner-only persistence, bounded retention by purpose, no secrets in telemetry, backup exports encrypted with validated codecs, preserve only required dispute/revocation evidence. Explain that deletion/revocation cannot recall previously disclosed information or peer backups. Do not claim forensic erasure.
- Performance and denial of service: bounded batch, cancellation and deadlines; provider outages do not compromise ordinary local product operations.

## BM-07 — UX and commercial policy

Private matching dashboard: owner inventory/wants, scopes and expiry, mode/provider information, match cards with own-rule explanations, consent review, disclosure preview, revoke/cancel, activity and safe recovery. A compatibility message must not imply ownership, proof of payment, completed exchange or verified third-party claims. When a provider cannot satisfy the selected security policy, show a truthful unavailable state.

Core local workflows remain available without a paid subscription, remote account or wallet. Optional later monetization: opt-in hosted computation, enterprise integration/licensing, advanced bulk procurement and disclosed service fees. Pricing, refunds, licensing, jurisdictional review and user approval are prerequisites for any paid service; no token launch or automatic fund transfer authorized by this spec.

## BM-08 — Release policy

P1 starts with specification reconciliation, local domain foundation and independent verification. Prioritize these alongside existing P1 vault/identity/recovery safety work; do not skip prerequisite safety gates or disrupt active integration branches. See [roadmap](ROADMAP.md) for measurable tests. No feature is production-ready because a document, catalog record, mock, passing unit test or demo exists. Confidential provider activation requires a separate documented security decision, review, real protocol tests and target-device acceptance.
