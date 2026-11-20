# Historical CR findings: current implementation and remaining boundaries

## Scope and method

This is a defensive source/evidence reconciliation of the 13 existing CR rows
(`CR-09` through `CR-21`) in the
[security findings tracker](../../../../planning/SECURITY_FINDINGS_TRACKER.md),
using the original
[November 15 architecture audit](../../../../SECURITY_RED_TEAM_AUDIT_2026-11-15_PASS2.md).
The original audit and tracker remain unchanged. **All 13 findings remain OPEN.**
Their historical severities, provisional gates and owner roles are not approval
decisions made by this review.

Inspected source: `94a34723108cf60db3b9bab1c669f5c9b5c36cd3`, tree
`1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4`. Current main at reconciliation
was `137d88e36cc6b1611b062daa33cf84c3d29c86b3`. Published PR #58
(`25b47081`) and #59 (`86cd564e`) plus the local freeze-reason continuation
are pending candidates. Their local checks are separately recorded and do
not establish hosted qualification or release approval.

The 2026-11-15 audit described a planning repository and often assumed a
server-account authority model. The current
[project contract](../../../../PROJECT_SPEC.md) and
[runtime scope](../../../../README.md) describe a local vault with user-held
keys and optional relays. The mapping below examines current boundaries;
it does not copy older server assumptions into the product or treat the
existence of a helper as a completed feature. Referenced code was inspected,
and the source diff against main was checked to separate inherited controls
from pending changes. No new product tests or exploitation were performed
for this documentation review.

## Finding-by-finding mapping

| Existing ID | Current bounded implementation or evidence | Unresolved boundary and next concrete step |
|---|---|---|
| CR-09 | The inherited [dependency checker](../../../../tools/deps/deps.mjs) enforces package-layer direction and module entry points. The strict generated registry has a separate checked dependency model. The old [feature matrix](../../../../DEPENDENCY_MATRIX.md) still repeats cross-cutting F07/F10/F15/F16 references, including on those features' own rows. These are different representations. | Reconcile the historical matrix with the canonical module graph, explicitly distinguishing shared references, build imports and optional runtime composition. Keep executable graph checks and ownership contracts; a green import-layer check alone does not close all graph semantics. |
| CR-10 | The inherited [vault implementation contract](../../../../packages/vault/README.md) provides encrypted identity preservation, passphrase unlock and signed record backup/restore. It explicitly excludes password reset, delegated-device lifecycle, recovery notice and the canonical dispute workflow. | Define the current local-first root/device/recovery authority and compatible recovery protocol before adding account-style reset or delegation. Preserve the existing signing identity on browser import failure. Qualify authority transitions and device recovery separately from record restoration. |
| CR-11 | The inherited [bus](../../../../packages/kernel/src/bus/bus.ts) requires an authorization port for commands and queries. The [PWA composition](../../../../apps/pwa/src/main.ts) binds the active user, tenant and exact unlocked session; ordinary [archive handlers](../../../../packages/bazaar/src/listings/archive.ts) additionally check owner and revision. | These concrete owner boundaries do not supply the product-wide resource/action matrix or all privileged moderator/support/relay policies. Define each enabled surface's authority and purpose constraints, then verify its real composition. The current registry extraction changes no PWA authorization decision. |
| CR-12 | [Identity exports](../../../../packages/identity/src/index.ts) provide key/identity primitives. Existing [relay-local account-limit helpers](../../../../packages/moderation/src/antifraud/limits/index.ts) distinguish tiers and limits, but their header explicitly treats them as local friction. The [runtime scope](../../../../README.md) does not claim a completed reputation product. | Specify qualifying interaction facts, private provenance, correction/appeal and rating retention before composing a reputation workflow. Do not present a rate-limit tier, signature or helper record as established reputation or completed transaction evidence. |
| CR-13 | Inherited [location handlers and codec](../../../../packages/discovery/src/geoprivacy/location/index.ts) enforce L0/L1/L2 projections, owner-scoped settings and a bounded local home-change window. Public events omit the private home field. The new reader recovery scenario is pending PR #58 qualification. | The local setting guard is explicitly not a network query boundary. Sparse-result policy, correlation limits, relay query budgets and location/query retention need contracts for the actual hosted discovery surface. Keep coarse projection and private recovery acceptance distinct from broader geographic anonymity guarantees. |
| CR-14 | The inherited [action queue](../../../../apps/pwa/src/action-queue.ts) serializes accepted actions and binds them to the exact unlocked session. [Session guards](../../../../apps/pwa/src/vault-session.ts) reject stale asynchronous completion. [Mutiny state](../../../../packages/mutiny/src/trade_proposals/index.ts) binds consent/reservation evidence to the proposal and treats freezes as terminal. Pending recovery changes preserve manual-review and local-freeze reasons. | A durable network command queue with revocation/reconciliation semantics is separate. Reconcile the remaining generic server-acknowledgement sentence in [PROJECT_SPEC.md](../../../../PROJECT_SPEC.md) with the current local-first authority model before implementing it. Define local acceptance, signed peer evidence and transport delivery as explicit distinct states; never infer automatic trade continuation from replay. |
| CR-15 | The inherited [communications scope](../../../../packages/comms/README.md) provides an opt-in subject-known consent core and explicitly leaves messaging, attachments, meetups and transport unimplemented. The [notification composition](../../../../packages/notify/README.md) supplies a local inbox with no push/email grant or delivery. | Complete authenticated recipient-key discovery, private transport, attachment admission, block/report boundaries and explicit precise-location sharing before enabling a messaging/meetup product. Local notification or consent-core acceptance does not qualify those absent compositions. |
| CR-16 | The inherited [federation primitive contract](../../../../packages/federation/README.md) documents bounded canonical input, DID binding, CID/signature checks and detached immutable verified output. It explicitly requires receiver domain authority checks and limits alpha listing exchange to per-subject chains. | Delegated devices, revocation, author-stream gap handling, transport and distributed retention remain separate. Select an explicit compatible protocol boundary and independently qualify canonical vectors and ordinary migration before enabling broader federation. Preserve existing alpha signature and CID bytes. |
| CR-17 | The inherited [listing history writer](../../../../packages/bazaar/src/listings/history.ts) stores public-field snapshots with revision metadata; signed publications and coordination evidence exist in their owning domains. [Commerce exports](../../../../packages/commerce/src/index.ts) currently expose precision and currency foundations. | These records are not a completed commerce evidence, settlement or adjudication system. Define evidence creation authority, portable integrity verification, privileged correction/access and retention/hold semantics for the actual commerce workflow before composing claims or receipts. |
| CR-18 | The inspected `packages/auctions` tree contains package/configuration files and no runtime source entry point. The [runtime scope](../../../../README.md) explicitly leaves auctions incomplete; generated specification presence is not execution. | Specify the seller-selected host's authoritative clock/order, atomic bid acceptance, visibility and correction rules, then implement that owning workflow. Qualify deterministic ordinary concurrency and idempotency behavior before exposing auction controls. |
| CR-19 | Inherited [archive handlers](../../../../packages/bazaar/src/listings/archive.ts) implement owner restore windows and return a restored listing unpublished. The [runtime scope](../../../../README.md) leaves complete purge open. The [backup contract](../../BACKUP_SCOPE.md) names its record scope and excludes infrastructure/media state. | Define a single data-category lifecycle covering holds, evidence, tombstones, copies and backup restoration. Implement a bounded resumable purge and a verifiable completion record. Archive or signed withdrawal must not be reported as erasure of peer copies or an end-to-end deletion guarantee. |
| CR-20 | Inherited encrypted storage/record backup, structured logging and optional relay limit helpers provide bounded controls. Pending PR #58 extends the [log redactor](../../../../packages/kernel/src/observability/redact.ts) vocabulary; PR #59 adds ordinary notification/barter recovery acceptance. The [remaining-work register](../../REMAINING_WORK.md) keeps relay composition and release evidence open. | Establish operational ownership, credential lifecycle, restricted audit access, restore exercises and incident/disclosure runbooks for the service actually operated. Record executed exercises and deployment-specific controls separately from library tests; do not infer them from a logger or backup helper. |
| CR-21 | The current [risk register](../../../../RISK_REGISTER.md) still has eight broad rows and five columns. The 51-row tracker preserves distinct readiness findings. This reconciliation adds concrete code/evidence boundaries without changing either source's status. | Add linked asset/authority, accountable owner, verification evidence, residual risk and closure-review fields through the governance workflow. Map shared findings to a control once while retaining each source ID. Planned modules, passing path-count checks and this review alone must not mark a risk mitigated. |

## Source and qualification boundaries

The inherited implementations above are present on inspected main. The
candidate's changed production paths are the shared backup registry/PWA
composition, barter codecs/view, log redaction and coordination reconstruction.
The historical root audit's statement that no application exists should not be
reused as a description of this current code. Conversely, an implemented alpha
subset cannot close the entire original readiness finding.

Actual execution records remain source-specific:

- [PR #58 local qualification](../20261120/QUALIFICATION-ROUND4.md): complete
  local 811-case checkpoint and preserved incomplete/browser setup attempts.
- [PR #59 local qualification](../20261120-next-recovery/QUALIFICATION.md):
  127 selected cases and exact recovery boundaries.
- The separate freeze-reason evidence records its own 39-case selection;
  those results do not become a full-suite result for later changes.

This review makes no new native-browser, hosted operational, penetration-test,
hardware, deployment or release claim. All original rows and provisional
approval requirements remain intact.
