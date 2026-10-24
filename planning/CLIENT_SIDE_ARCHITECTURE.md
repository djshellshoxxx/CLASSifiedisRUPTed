# Client-owned CLASS architecture — 2026-10-24

Status: **MANDATORY product constraint; engineering baseline pending independent review.**
Source: current owner delegation requiring the entire CLASS suite to be client-side with user-controlled local keys/data, no mandatory product-operated backend, central account database or server-held user secrets. This supersedes contradictory proposals at `39ac847870746e14b466d5706ebe5b00dddbaadb`. That branch and PR #1 remain historical records. QuietVote and Circula are outside this repository and outside this change.

## Authority and ownership

- ARCH-001: Installable static PWA; first installation/update may need a static distributor. After installation the basic vault, draft listings, local search of retained records, matching and evidence review work without any product service. There is no required account registration, product API, SQL service, telemetry collector, credential issuer or secret manager. A static distributor can serve malicious new code; HTTPS does not make that code trustworthy.
- ARCH-002: F07 identifies a local principal by a user-controlled key, not a central account. A pseudonym is a display label. A key proves authorship only; it does not prove a human, physical ownership, age, reputation or entitlement to somebody else's data. F16 owns cryptographic protocol review; no homemade primitives. Nonextractable browser keys protect against extraction through that API, not malicious same-origin code using the key. Portable recovery and encrypted backups need their own reviewed key-wrapping/KDF profile before enablement.
- ARCH-003: F15 owns one IndexedDB vault per local principal/origin. Domain records, local revision guards, command receipts and local event records commit in one transaction where they share a database. A transaction cannot include network requests or remote vaults. IDs are client-generated and collision-checked locally; claimed timestamps are untrusted. There is no global monotonic time, server sequence, global uniqueness oracle or global administrator.
- ARCH-004: The vault unlocks only on explicit local user action. Locked vault, unavailable crypto, quota failure or schema incompatibility returns a typed failure and no acknowledged mutation. Browser storage can be denied, evicted or cleared; a local transaction is not an independent backup. The product must expose storage status and user-controlled export/restore. Never upload keys for recovery or silently fall back to plaintext remote storage.
- ARCH-005: A locally committed record may later be exported with explicit consent. F11 validates each imported signed public projection against version, shape, size, author/key association, signature and local policy before indexing. Unknown or revoked keys, missing predecessor, same-revision conflicting digests and unrecognized schemas quarantine rather than choose a winner. Revocation is as current as received evidence; disconnected clients cannot know newly published revocations.
- ARCH-006: A user may exchange an export file directly or select an external peer, relay or storage adapter. The adapter is an optional transport/cache, never source of authority for local records. It receives only approved public projections or reviewed encrypted opaque envelopes. No remote private plaintext, passwords, signing keys, exact home address, private graph or default contact upload. No automatically configured remote endpoint. Stopping an adapter preserves local records and makes delivery status visibly unknown/pending.

## Consistency and shared-state limits

| State | Exact meaning | Does not establish |
|---|---|---|
| local draft | saved for this device/principal | published, sent or accepted |
| local committed | local transaction completed | remote persistence or off-device recovery |
| export prepared | disclosure preview approved and bytes produced | delivery |
| transport acknowledged | named adapter reports byte receipt | peer validation, durable retention or consent |
| peer accepted | verified named peer acknowledgement of exact digest | all peers agreed or real-world truth |
| consent collected | every listed principal signed the current proposal digest under the reviewed protocol | global asset exclusivity or handoff |
| locally reserved | this vault rejects another local reservation | dishonest owner/other device/other network cannot double-promise |
| handoff reported | named party asserted its own handoff/receipt | delivery independently proved or all money settled |
| externally observed | named external source provided evidence under a specific policy | irreversible settlement or correctness of source |

ARCH-007: Local tab races use IndexedDB transaction revision checks, not a JavaScript mutex alone. Multiple devices/vault forks can produce conflicting promises; automatic last-write-wins is forbidden for consent, money, identity revocation and inventory commitments. Detect known conflicts, freeze affected coordination, present evidence and require a new explicit agreement. Absence of a detected conflict is not proof of global exclusivity.

ARCH-008: A cycle can collect unanimous signatures on an immutable proposal. Every participant controls its own local reservation and separately verifies others' statements. There is no cross-vault atomic lock, distributed transaction, trusted deadline or guaranteed physical rollback. Revocation before handoff invalidates locally known readiness; an offline peer may not learn it promptly. UI must show each participant's evidence and freshness. No label may imply a globally locked or risk-free cycle.

ARCH-009: F12 moderation is local filtering plus optionally subscribed signed policy/advisory feeds. A person may choose a reviewer and voluntarily disclose evidence. Reports stay local unless explicitly shared. Local hiding/tombstones affect this vault and cooperating recipients; no compulsory global takedown, identity suspension, Sybil prevention or erasure of copied public data. Do not advertise global moderation or assume legally reviewed policy exists.

## External dependency and failure matrix

| Capability | Local baseline | Optional dependency | Offline / rejected / missing dependency |
|---|---|---|---|
| Discovery | search retained approved projections | user-selected public feed/peer; region taxonomy | show coverage and last import; no claim of live or complete market |
| Exchange | create/review proposals; local matching | direct file exchange or chosen transport | retain local draft/commit; no remote consent invented |
| Messaging | local drafts only initially | reviewed device encryption + key verification + chosen transport | sending disabled `PROTOCOL_NOT_REVIEWED`; no plaintext relay fallback |
| Notifications | in-app notices from local events while running | user-selected push sender/service or mail provider | no background delivery promise; push/email disabled until specified |
| Payments | manual claim/acknowledgement evidence | external wallet, chain/RPC or chosen verifier | `unverified`/`unknown`; no webhook receiver or product API required |
| Storage/recovery | local vault and explicit export | user-selected encrypted backup location | last backup unknown/stale; data loss possible without export |
| Auctions/rentals | local proposals and availability notes | explicitly agreed peer protocol/time source if needed | no sealed-bid fairness, trusted close time or global booking exclusivity claim |
| Paid placement | local display preference only | owner-approved audience/payment policy and optional external data source | no shared audience/paid reach guarantee; remain gated |
| Federation | user-approved signed public file interchange | chosen peer/relay; no ActivityPub compatibility assumed | no delivery/freshness/deletion guarantee |

ARCH-010: Feature flags are local controls and default off for unreviewed transports/protocols. A local flag cannot enforce rules on a modified client. Disabled operations return `FEATURE_DISABLED` or `PROTOCOL_NOT_REVIEWED` without network side effects. A documented gate is not an approved product-scope deferral; all 1,480 process specifications remain tracked.

## Invariants and acceptance contracts

- T-ARCH-01: With all network blocked after installation, create a vault/draft, query local data and run bounded matching; no login or product endpoint request. Inspect network calls to prove no hidden dependency.
- T-ARCH-02: Local transaction fault, storage denial/quota and schema failure produce no acknowledged partial record/event/receipt. Two tabs race on one revision; exactly one local commit succeeds. Two independent vaults may both commit: detect exchanged conflict and never claim global exclusivity.
- T-ARCH-03: Adapter unavailable/lying/reordered/duplicate acknowledgements cannot create peer consent, payment confirmation, remote deletion or handoff evidence. Untrusted wall clocks cannot establish trusted auction fairness or revocation freshness.
- T-ARCH-04: Reject private fields in public projections; canary exact address, keys and message drafts never reach adapters, logs or analytics. Unreviewed messaging/push/email/payment-verification paths fail closed.
- T-ARCH-05: Export/restore/fork/revocation corpus tests show stale/invalid signatures, unknown keys and same-revision forks quarantine. An old backup cannot silently restore accepted consent or invalidate known revocations.
- T-ARCH-06: Accessibility tests distinguish local save, pending delivery, partial consent and claimed/observed settlement with visible text and screen-reader status, not color alone.
- T-ARCH-07: Review static supply chain, CSP, dependency integrity, offline updates, key use/unlock, encrypted vault/backup protocol, lost-device recovery and shared-computer caches before implementation approval.

These are specified test obligations, not executed product tests. The engineering baseline still needs independent review and complete child contracts. No specification is approved by this file.

## Conflicts requiring explicit resolution

| Conflict | Affected contracts | Resolution / remaining gate |
|---|---|---|
| Mandatory API/SQL/session authority | ADR-0001/0008/0010/0014; CR-001..006; PS-054, PS-117..119 | superseded by local authority; leaf migration required |
| Server-readable private messages | ADR-0013; MPF-001; PS-060..061 | rejected; encryption/key lifecycle protocol review required before sending |
| Atomic reservations across people | CB-003/006; F01/F02 | local-only guarantees plus signed commitments; owner must accept limitation before any stronger product claim |
| Always-on push/email | F13 PS-102..108 | in-app baseline; optional chosen service requires separate dependency/privacy contract |
| Global enforcement, erase and single time | F04/F05/F10/F12/F18 | impossible under this architecture without additional trust; no silent substitution with centralized infrastructure |
| All original ideas covered | private original-idea conversation absent | root files/registry define available scope only; owner must supply missing requirements before exhaustive original-idea coverage can be certified |

## Evidence

Reviewed 2026-10-24: [IndexedDB specification](https://www.w3.org/TR/IndexedDB/) describes scoped local transactions; [Storage Standard](https://storage.spec.whatwg.org/) defines storage persistence permission and quota; [Push API](https://www.w3.org/TR/push-api/) describes the external sender/push-service path. The local-authority and failure policies above are engineering decisions derived from these platform constraints. They are not guarantees made by those standards.
