# BlindMatch — confidential economic discovery

**Owner priority: P1 flagship. Status: disabled local foundation implemented;
broader confidential scope planned and unqualified.** Public direction published
2026-11-26; reconciled with F19 local contracts 2026-11-27.

BlindMatch is the flagship product direction. LocalBazaar and LocalMutiny are
subsequent product releases whose existing public-listing and barter foundations
remain reusable. Later extensions include services, rentals, auctions and group
purchasing. BlindMatch discovers opportunities using preferences that participants
need not publish. A match is an invitation, not consent to trade, a reservation,
a payment or evidence of physical delivery.

See [architecture and user-flow diagrams](DIAGRAMS.md) and [implementation and acceptance roadmap](ROADMAP.md).

## Current local contract and precedence

The canonical [PS-149 private-intent contract](../../19_BlindMatch/01_intents/mod_local/module.spec.yaml),
[PS-150 matching contract](../../19_BlindMatch/02_local_matching/mod_matcher/module.spec.yaml),
and [package scope](../../packages/blindmatch/README.md) govern the implemented
local slice. They take precedence over the broader proposed roles below.

- The current private intent has a random UUIDv4, an optimistic revision, bounded
  criteria, expiry, and `draft`, `active` or `paused` state. Erasure is row absence,
  never an archived or deleted-object record. Backup restoration returns a draft.
- One explicit local match compares private criteria with at most 128 authenticated,
  already-retained public records. It returns only public owner/listing/revision/CID
  references. Jobs, results and cancellation epochs remain ephemeral.
- Local APIs register no command-bus operations and emit no events, notifications,
  request hashes, audit entries, tombstones or identifying completion/deletion
  history. `RET-OWNER-LIVE` in [CTR-PRV-001](../../planning/contracts/CTR-PRV-001.md)
  governs local intent erasure. Logging and metrics are absent.
- No confidential cross-user computation, external disclosure, provider, chain,
  contact, reservation or payment is activated. The F19 modules remain `FUTURE`;
  the main application launch gate must stay false during this continuation.
- Current-source browser and real-device qualification remain separate from
  implementation. See the [November 27 analysis](../development/cycles/20261127-blindmatch-view/ANALYSIS.md)
  for the frozen source and execution boundaries.

The following broader requirements are future work unless the current contract
above explicitly implements them. They do not authorize new retained identifying
history or expand the local API's authority.

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

The current BlindMatch slice owns private intents and ephemeral local matching.
Profiles, cross-party authorizations and disclosure records are future design
roles, not additional persisted entities in this implementation. Existing domains
retain ownership of listing revisions/availability, identity/key validity,
money/currency, consent, trade proposals, holds, receipts, messaging, moderation
and retention. Use versioned ports and authenticated domain handlers. A composition
adapter may read the current owner's retained public discovery records using the
owning domain's canonical keys, schemas and signature/provenance validators;
UI code must not bypass those checks or read another domain's private tables.
The existing public matching engine remains unchanged for public data; reuse
compatible pure rules or adapters only within the new privacy boundary. Existing
signed-file bytes, IDs and backups remain compatible. New persistent records need
reviewed codecs and migrations. Current restore rejects unknown or malformed
records without silently dropping them; a future quarantine workflow is separate.

F19 is assigned to BlindMatch. PS-149 / F19.S01.M01 owns private local intents;
PS-150 / F19.S02.M01 owns bounded local matching and session orchestration. The
generated catalog contains 19 features and 150 modules. Both F19 modules remain
`FUTURE`, with no command-bus registration or user-facing activation. Future
modules must reconcile ownership against `planning/modules.yaml`, supply canonical
specifications and process documents, and pass the existing spec/dependency/registry
checks. Catalog inclusion and P1 priority do not grant activation. Disabling the
local view conceals its state and cancels work; it neither erases saved intents
automatically nor changes existing public-listing/barter recovery contracts.

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

The following roles describe future cross-party/confidential workflows, not the
current local schema. Any new operation must use the owning domain's authority
checks and reviewed versioned ports. The local APIs remain event-free and do not
use bus idempotency. Persistence, replay prevention and revocation designs for
external side effects require a separate decision compatible with owner erasure;
the table grants no exception for identifying deletion history.

| Record | Required content / boundary |
|---|---|
| Future intent extensions | have/want/buy/sell roles, quantity/availability and soft rules may extend the canonical local intent only through a reviewed schema/codec change; encrypted owner-only |
| MatchAuthorization | owner, purpose, allowed fields and outputs, mode/provider, audience, scope, immutable intent revision binding, expiry, revocation state; owner-signed when crossing a trust boundary |
| Future remote job | opaque operation ID, authorization references, appropriate commitments, protocol/policy version, deadline and outcome; recovery/replay persistence remains undecided and must be compatible with erasure; local jobs remain ephemeral |
| Future cross-party suggestion | authorization/job binding, permitted minimal outcome, expiry, evidence and revision bindings; no raw peer profile; local suggestions remain ephemeral public references |
| DisclosureGrant | specific fields, recipients, match and revision binding, expiry, explicit confirmation; revocable prospectively |
| TradeProposalRef | canonical proposal identifier/revision and evidence link; existing barter/commerce domain owns terms and lifecycle |

Proposed future operations include scoped authorization/revocation, remote-job
start/cancel, introduction acceptance, explicit disclosure and a request to the
canonical trade domain. Current local intent operations remain create/read/list,
revise, activate/pause and erase; no identifying archive or activity history is
added. Enforce owner scope, current key/session validity, feature gate, validated
revision and owning-domain authority. Cross-party records, if later implemented,
must be explicitly authorized, versioned and authenticated. No implicit event or
audit sink is permitted for private local operations. Private fields do not enter
URLs, logs, push messages or public projections.

Provider boundary: typed validated request plus context and cancellation; return pending, verified eligible, verified ineligible, failed, cancelled or unknown, with protocol/version and evidence sufficient for the selected mode. Eligibility can be accepted only if evidence binds to current authorizations, input versions, purpose, nonce/session and expiry under the reviewed verification mechanism. Unsupported security capabilities fail closed. No silent downgrade. A generic provider signature is not proof of correct computation. Public errors use existing kernel conventions; do not disclose the rejected peer constraint. Unknown outcome never implies no match or permits unbounded replay.

## BM-05 — Matching semantics

Bilateral eligibility = both sides' hard constraints satisfied AND both authorizations current AND compatible listing/intent revisions AND neither participant blocked. For price overlap, require same exact currency binding and validated nonnegative integer minor units before comparing buyer maximum >= seller minimum. Missing currency/unsupported precision/stale quote is ineligible for computation, not coerced to a default. Cross-currency matching waits for explicit pinned-quote policy. Private numerical scoring is not exposed as public evidence. No automatic midpoint.

A cycle is a directed set of distinct participants and assets with one compatible outgoing and incoming leg per participant. Apply all hard constraints and current availability before scoring. Preserve deterministic tie rules and stable ordering for identical authorized snapshots. Bound graph size, candidate count, search time and memory. Revalidate all canonical asset revisions and availability before producing a proposal. No match may imply a hold. Dropout, conflicting holds, stale evidence or material revision freeze or invalidate the suggestion; never silently reroute. All-party consent remains mandatory for execution. Matching cannot make physical goods exchange atomic.

## BM-06 — Lifecycle, privacy and recovery

For the current local slice, intent states are `draft`, `active` and `paused`;
expiry is checked against the clock and erasure removes the row. Revisions and
ephemeral epochs reject stale results. Local jobs and suggestions are never saved,
replayed or recovered. Restore produces draft content and requires a fresh owner
action. No local API writes intent-derived idempotency keys, dedupe records,
revocation records or identifying deletion/completion history.

The job and introduction diagrams describe future external workflows. Possible
remote-job outcomes include queued, running, verified, failed, cancelled, expired
and unknown. Before implementing external side effects, define how current
authorization, revocation, interrupted outcomes and duplicate prevention remain
compatible with owner erasure. The earlier proposal to retain intent-derived
keys or dedupe history does not apply to the local slice and is not an approved
future retention design. Unknown outcomes never permit automatic side-effect
retries or execution. A future suggestion reaches an owning-domain proposal only
through explicit consent.

Lock, account switch and feature disable synchronously revoke the current view,
cancel active work and conceal private fields/results. The qualified local path
requires no network. Nonlocal modes remain unavailable until separately reviewed;
never fabricate a result or fall back to plaintext processing.

Threats and controls:
- Unauthorized reads, malicious peers or provider compromise: minimum output, current capabilities, independently reviewed trust assumptions, strict scope and validation; no provider receives raw private preferences in qualified confidential modes.
- Preference inference from repeated matches: bounded authorized attempts per scope, meaningful consent to new queries, abuse controls, coarse/minimal output, no unlimited arbitrary comparison oracle; assess cumulative output leakage and Sybil limitations before release.
- Metadata and linkability: document network endpoints, timing, ciphertext sizes, public buckets, identities and observable access patterns. Do not promise anonymity; preserve safe transport choices without requiring anonymity networks. Coarse location only by default, exact meetup details explicitly shared separately.
- Integrity and replay: bind versions/expiry/purpose, reject invalid ciphertext/proof, stale and duplicate responses, enforce independent verification; adversarial input limits and fail-closed parsers.
- Abuse: opt-in only; block/report and appeal support, user-visible scope, anti-spam limits, no unsolicited contact or automatic identity disclosure. Marketplace safety policies remain applicable. No arbitrary personal profiling or discriminatory high-stakes matching.
- Data lifecycle: encrypted owner-only persistence and validated encrypted backups. Owner erasure removes the current local intent without identifying logs, events, hashes, tombstones or completion records. Future dispute/revocation protocols must be designed consistently with that privacy requirement; generic evidence-retention rules cannot silently override it. Broader account/content/derivative erasure is still unfinished. Explain that local deletion cannot remove independently held backups, prior peer disclosures or physical storage remnants; do not claim forensic erasure.
- Performance and denial of service: bounded batch, cancellation and deadlines; provider outages do not compromise ordinary local product operations.

## BM-07 — UX and commercial policy

The bounded local view is an owner intent editor with explicit save/activation,
pause, erase and cancel actions, and minimal public result references. It must
clear private fields and results on session loss or disablement. Saving does not
match, restoring does not activate, and no activity log is retained.

A future confidential dashboard may add scopes, provider information, permitted
own-rule explanations, consent review and disclosure previews after those owning
contracts are qualified. A compatibility message must not imply ownership, proof
of payment, completed exchange or verified third-party claims. Unavailable privacy
capabilities must be described truthfully.

Core local workflows remain available without a paid subscription, remote account or wallet. Optional later monetization: opt-in hosted computation, enterprise integration/licensing, advanced bulk procurement and disclosed service fees. Pricing, refunds, licensing, jurisdictional review and user approval are prerequisites for any paid service; no token launch or automatic fund transfer authorized by this spec.

## BM-08 — Release policy

P1 continues from the implemented local foundation with authenticated adapter,
view/session composition and independent verification. Keep the main launch gate
false and F19 `FUTURE` while native/mobile, accessibility and activation requirements
remain open. Existing P1 vault/identity/recovery work retains its own ownership and
integration sequence. See [roadmap](ROADMAP.md) for measurable tests. Documents,
catalog entries, mocks, passing unit tests and demos do not establish production
readiness. Confidential activation needs a separate documented protocol/security
decision, real protocol tests, independent review and target-device acceptance.
