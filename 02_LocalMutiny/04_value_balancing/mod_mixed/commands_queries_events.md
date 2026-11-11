# PS-026-04 — Commands, queries and events: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-04.R01** propose, withdraw and suggest_plan are vault commands or pure queries that produce no statement, because legs are consented inside the signed revision; claim produces the payment claim statement defined by F09.S01.M01.
- **PS-026-04.R02** Acknowledgement by the payee is a F09.S01.M01 command and arrives here as a consumed event; this module never marks a payment acknowledged on its own.
- **PS-026-04.R03** Events are written in the same IndexedDB transaction as the state change and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-026-04.R04** Deals follow the N5 contract: commerce.deal.open {contextRef {type: cycle_compensation, id}, contextCid, parties, obligations} with deterministic dealId, commerce.deal.cancel on cancellation, and payment events matched by dealId with obligationId or claimId; this module produces no statement of its own and acts only on F09 records the receiving vault accepted (N2).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.compensation.propose` | mutiny.compensation.propose | { subjectType, subjectId, kind, payerId, payeeId, amount: Money, methods[], extraLegId?, planBasis? } — vault command; produces no statement, sealed later by a revision | { compensationLegId, status: proposed, residualGaps: { actorId, gapMinor, withinTolerance }[] } | VALIDATION_FAILED, MUTINY_COMPENSATION_PARTY_INVALID, MUTINY_COMPENSATION_LIMIT, MUTINY_COMPENSATION_NOT_ALLOWED, CONFLICT_STATE | mutiny.compensation.proposed | yes (Idempotency-Key) |
| `mutiny.compensation.withdraw` | mutiny.compensation.withdraw | { compensationLegId, expectedRevision } | { compensationLegId, revision, status: withdrawn } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `mutiny.compensation.claim` | mutiny.compensation.claim | { compensationLegId, method, claimRef?, expectedRevision } — vault command; calls commerce.payment.claim {dealId, obligationId: compensationLegId, method, amount, txRef?}, which produces classrup.commerce.payment_claim/v1 signed by the payer | { compensationLegId, paymentClaimId, claimStatusLabel: claimed_unverified, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_COMPENSATION_CLAIM_NOT_ALLOWED, DEPENDENCY_UNAVAILABLE | mutiny.compensation.claimed | yes (Idempotency-Key) |
| `mutiny.compensation.activate` | mutiny.compensation.activate | { compensationLegId, recoveryCaseId, acceptingActionCid } — internal vault port called by F02.S03.M04 in the transaction of the last required accept of a compensation option; opens the Deal; produces no statement of its own (commerce.deal.open produces classrup.commerce.deal/v1) | { compensationLegId, status: due, dealId, dueAt } | NOT_FOUND, CONFLICT_STATE, MUTINY_COMPENSATION_NOT_ALLOWED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.compensation.suggest_plan` | mutiny.compensation.read | { subjectType, subjectId, acceptedImbalances?: { actorId, maxAmount }[] (draft values for the next revision; only the entries sealed in the head snapshot count for feasibility) } | { legs: { payerId, payeeId, amount: Money }[], residuals: { actorId, gapMinor, withinTolerance }[], toleranceBasis: profile version } | NOT_FOUND, VALIDATION_FAILED |
| `mutiny.compensation.get` | mutiny.compensation.read | { compensationLegId } | { leg: CompensationLeg, claimStatusLabel?, expiresInMs? } | NOT_FOUND |
| `mutiny.compensation.list_for_subject` | mutiny.compensation.read | { subjectType, subjectId, status? } | { items: CompensationLeg[], allSettled: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.compensation.proposed` | P2 | { compensationLegId, subjectType, subjectId, kind, payerId, payeeId, amount, planBasis } |
| `mutiny.compensation.claimed` | P2 | { compensationLegId, subjectId, payerId, payeeId, amount, method, claimStatusLabel } |
| `mutiny.compensation.settled` | P2 | { compensationLegId, subjectId, payerId, payeeId, amount, via: acknowledged\|final\|extra_item_received\|dispute } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.committed` | turn referenced proposed legs into due, set dueAt, open the F09 Deal for money legs |
| `mutiny.cycle.cancelled` | withdraw proposed and due legs of the cycle when no handover happened |
| `mutiny.cycle.declined` | withdraw proposed legs of the cycle |
| `mutiny.proposal.revised` | withdraw proposed legs that the new head revision does not reference; mark referenced ones sealed |
| `mutiny.leg.received` | settle extra_item legs when the carrying leg has a valid receiver attestation |
| `commerce.payment.claimed` | matched by dealId and obligationId: for a leg claimed by the payer on another device or a peer's claim, move due to claimed, store paymentClaimId and set claimStatusLabel |
| `commerce.payment.acknowledged` | matched by dealId and claimId: move claimed or disputed to settled for cash or external payments and emit settled |
| `commerce.payment.finalized` | matched by dealId and claimId: move a crypto claim from claimed to settled via final and emit settled |
| `commerce.payment.disputed` | matched by dealId and claimId: move claimed to disputed |
| `commerce.payment.expired` | matched by dealId and claimId: move claimed to expired |
| `commerce.dispute.resolved` | move disputed legs to settled or waived according to the recorded outcome, or to expired for resolution lapsed |
| `commerce.dispute.withdrawn` | move the disputed leg whose claim the case concerned back to claimed |
| `commerce.deal.cancelled` | move due legs of that Deal to withdrawn when not already terminal |
| `mutiny.recovery.resolved` | apply the recorded disposition to compensation legs of the cycle (waived or kept); for outcome unresolved move disputed legs to expired |
| `privacy.deletion.completed` | pseudonymize the erased DID in retained terminal legs with the deletion pseudonym and purge claimRef; F09 evidence keeps its own retention |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_COMPENSATION_PARTY_INVALID | 422 | no | payer and payee must be distinct participants of the subject |
| MUTINY_COMPENSATION_LIMIT | 409 | no | more compensation legs than allowed for this subject |
| MUTINY_COMPENSATION_NOT_ALLOWED | 409 | no | legs cannot be proposed in the subject's current state or by this author |
| MUTINY_COMPENSATION_CLAIM_NOT_ALLOWED | 409 | no | only the payer can claim a due leg of a committed, executing or partially executed cycle |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party cycle p1->p2->p3->p1, values (EUR minor): p1 gives 20000, p2 gives 14000, p3 gives 16000
# net position n_i = received - given:  p1 = 16000-20000 = -4000;  p2 = 20000-14000 = +6000;  p3 = 14000-16000 = -2000   (sum 0)
# tolerance_i = max(500 bps of larger side, 500 minor): p1 max(1000,500)=1000, p2 max(1000,500)=1000, p3 max(800,500)=800  => all three out of tolerance
# plan: debtors (n>tol) p2 6000; creditors (-n>tol) p1 4000, p3 2000; largest-first greedy with DID-ascending ties:
mutiny.compensation.suggest_plan { "subjectType":"cycle", "subjectId":"0192f432-…" }
-> { "legs": [ {"payerId":"p2","payeeId":"p1","amount":{"amount":"4000","currency":"EUR"}}, {"payerId":"p2","payeeId":"p3","amount":{"amount":"2000","currency":"EUR"}} ], "residuals": [ all 0, withinTolerance true ] }
# 2-party: gives 5000 vs 5600 => gap 600 > max(280,500)? tolerance max(5% of 5600 = 280, 500) = 500 => payer is the receiver of the larger item, pays 600 or accepts imbalance <= 600.
# 4-party and N-party use the same planner (at most N-1 legs). Payment: payer claims, payee acknowledges.
mutiny.compensation.claim { "compensationLegId":"0192f470-…", "method":"cash", "claimRef":"handed over at meetup", "expectedRevision":3 }
-> { "paymentClaimId":"0192f471-…", "claimStatusLabel":"claimed_unverified", "syncState":"prepared" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T04 | unit | PS-026-01.R01, PS-026-04.R01 | planner with an acceptedImbalances entry of the head snapshot covering one gap | that participant omitted and fewer legs produced |
| TEST-PS-026-09.T05 | integration | PS-026-03.R01, PS-026-03.R04, PS-026-04.R04 | cycle committed then claim then acknowledged | proposed to due to claimed to settled; Deal opened with contextRef {type: cycle_compensation, id: cycleId}, contextCid equal to the head contentHash and one obligation per money leg; events matched by dealId and claimId; settled event emitted |
| TEST-PS-026-09.T08 | contract | PS-026-04.R01, PS-026-04.R02, PS-026-04.R03, PS-026-09.R02 | commands, events and statement | outputs and payloads validate against classrup.mutiny.compensation_leg/v1, F09 claim statement and registry |
| TEST-PS-026-09.T18 | integration | PS-026-03.R05, PS-026-04.R04 | recovery compensation option Dan to Alice 80.00 EUR accepted by Dan only, then by Alice | leg stays proposed, then mutiny.compensation.activate moves it to due and opens a Deal with contextRef id recoveryCaseId |
| TEST-PS-026-09.T22 | integration | PS-026-03.R02, PS-026-04.R04 | cycle cancelled before handover with due legs; commerce.deal.cancelled received for another Deal | commerce.deal.cancel called once; legs withdrawn in both cases |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
