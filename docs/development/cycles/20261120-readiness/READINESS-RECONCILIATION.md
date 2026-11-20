# Historical readiness findings: current source and evidence map

## Outcome and limits

This reconciliation maps every existing finding ID from the five November 15
architecture audits to inspected current code/evidence, its unresolved boundary
and a concrete next control or acceptance step. **All 51 findings remain OPEN.**
The original audits and [tracker](../../../../planning/SECURITY_FINDINGS_TRACKER.md)
remain unchanged. No severity, provisional gate, owner role or release approval
is changed by this document.

The old audits describe design/readiness gaps. They are not 51 newly confirmed
runtime vulnerabilities, and the mapping is not a mitigation percentage. The
current local-first vault, executable domain code and actual tests must be
distinguished from the planning-only repository those audits described. Existing
partial implementations do not close the entire original product or operational
contract.

## Source and coverage

Reviewed runtime/test source: `94a34723108cf60db3b9bab1c669f5c9b5c36cd3`, tree
`1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4`.
Last inspected main: `137d88e36cc6b1611b062daa33cf84c3d29c86b3`.
PR #58 head `25b47081`, PR #59 head `86cd564e` and the current freeze-reason
continuation remain pending source-specific hosted qualification.

Three parallel source-review lanes cover the original ID set exactly once:

| Audit group | Existing rows | Current mapping |
|---|---:|---|
| BT | 12 | [BT and TD reconciliation](BT-TD-RECONCILIATION.md) |
| CR | 13, starting at CR-09 | [CR reconciliation](CR-RECONCILIATION.md) |
| S3 | 12 | [S3 and S4 reconciliation](S3-S4-RECONCILIATION.md) |
| S4 | 6 | [S3 and S4 reconciliation](S3-S4-RECONCILIATION.md) |
| TD | 8 | [BT and TD reconciliation](BT-TD-RECONCILIATION.md) |
| Total | **51** | No missing, duplicate or invented finding ID |

The [mapping receipt](mapping-receipt.json) records the original tracker/audit
blobs, all mapped IDs, preserved statuses and report identities. Mechanical ID
and link checks establish document integrity, not semantic control completion.
Each lane states its inspected scope and source/qualification limits.

## What current evidence changes

There is now a real alpha implementation: principal-scoped commands and storage,
encrypted identity and domain rows, signed statement admission, bounded local
barter state, local inbox behavior and record backup. These controls deserve
specific evidence links in the historical finding record; repeating that no
runtime exists would be inaccurate.

At the same time, the current product uses user-held identities and optional
relays. Older server-account assumptions need explicit reconciliation with that
authority model. A local vault restore is not delegated device recovery, a signed
statement is not payment or delivery, and local archival/withdrawal does not prove
erasure from a peer. Generic hosted controls require a real declared host and
composition before they can be accepted operationally.

The existing compiler, import-layer, registry and specification checks establish
specific mechanical properties. Executed case reports establish their actual
assertions at their exact source. Neither path counts nor the existence of a
module establishes semantic completeness, real-device budgets or release approval.

## Next bounded closure work

| Control family | Next evidence needed |
|---|---|
| Identity and authority | Consistent root/device/recovery authority across canonical contracts and real handlers, authenticated transitions and owner/participant adapters; preserve existing identity during recovery |
| Backup and data lifecycle | Explicit included/excluded stores, attachment/reference and delivery/lease policy, resumable purge/hold semantics, rotation and actual interruption/device acceptance |
| Consent and federation | Production subject/wording/key adapters, revocation-preserving recovery, compatible protocol boundary and authenticated dependency/order handling |
| Optional product modules | Actual composition and ordinary end-to-end acceptance for messaging, auctions, reputation, claims/receipts and other specification-only surfaces |
| Operations and governance | Accountable owner approval, declared service controls, restricted audit/incident procedures, executed restore/response exercises and source-specific release aggregation |
| Traceability and graphs | Reconcile historical planning matrices and templates with current canonical dependencies and executed assertions; retain explicit manual/hardware/operational gates |

These are future acceptance requirements, not work certified by this review.
The group reports give the narrower per-finding next action and inspected paths.
Do not create additional findings merely by counting the same cross-cutting
boundary once per historical audit, and do not remove source IDs as duplicates.

## Execution and publication discipline

The historical sources, tracker and risk register were read without mutation.
No offensive workflow, vulnerability reproduction, live service probe or new
product test was performed for the mapping. The separate runtime continuation
has its own [39-case qualification](../20261120-freeze-reasons/QUALIFICATION.md).
Earlier 127/811 counts and hosted observations retain their exact source scope.

Keep pending published source stable. Complete current-head hosted Alpha/browser
and CLI gates before ordinary integration, then inspect main's own push result.
This reconciliation is documentation evidence and does not replace those gates
or authorize a release, deployment, branch deletion or altered approval policy.
