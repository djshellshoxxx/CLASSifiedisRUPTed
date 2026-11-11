# PS-026-04 — Commands, queries and events: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-04.R01** propose, withdraw and suggest_plan are vault commands or pure queries that produce no statement, because legs are consented inside the signed revision; claim produces the payment claim statement defined by F09.S01.M01.
- **PS-026-04.R02** Acknowledgement by the payee is a F09.S01.M01 command and arrives here as a consumed event; this module never marks a payment acknowledged on its own.
- **PS-026-04.R03** Events are written in the same IndexedDB transaction as the state change and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.compensation.propose` | mutiny.compensation.propose | { subjectType, subjectId, kind, payerId, payeeId, amount: Money, methods[], extraLegId?, planBasis? } — vault command; produces no statement, sealed later by a revision | { compensationLegId, status: proposed, residualGaps: { actorId, gapMinor, withinTolerance }[] } | VALIDATION_FAILED, MUTINY_COMPENSATION_PARTY_INVALID, MUTINY_COMPENSATION_LIMIT, MUTINY_COMPENSATION_NOT_ALLOWED, CONFLICT_STATE | mutiny.compensation.proposed | yes (Idempotency-Key) |
| `mutiny.compensation.withdraw` | mutiny.compensation.withdraw | { compensationLegId, expectedRevision } | { compensationLegId, revision, status: withdrawn } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `mutiny.compensation.claim` | mutiny.compensation.claim | { compensationLegId, method, claimRef?, expectedRevision } — vault command; produces the payment claim statement of F09.S01.M01 (classrup.commerce.payment_claim/v1) signed by the payer | { compensationLegId, paymentClaimId, claimStatusLabel: claimed_unverified, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_COMPENSATION_CLAIM_NOT_ALLOWED, DEPENDENCY_UNAVAILABLE | mutiny.compensation.claimed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.compensation.suggest_plan` | mutiny.compensation.read | { subjectType, subjectId, acceptedImbalances?: { actorId, amount }[] } | { legs: { payerId, payeeId, amount: Money }[], residuals: { actorId, gapMinor, withinTolerance }[], toleranceBasis: profile version } | NOT_FOUND, VALIDATION_FAILED |
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
| `commerce.payment.claimed` | for a leg claimed by the payer on another device or a peer's claim, move due to claimed and set claimStatusLabel |
| `commerce.payment.acknowledged` | move claimed to settled for cash or external payments and emit settled |
| `commerce.payment.disputed` | move claimed to disputed |
| `commerce.payment.expired` | move claimed to expired |
| `commerce.dispute.resolved` | move disputed legs to settled or waived according to the recorded outcome |

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
| TEST-PS-026-09.T08 | contract | PS-026-04.R01, PS-026-04.R02, PS-026-04.R03, PS-026-09.R02 | commands, events and statement | outputs and payloads validate against classrup.mutiny.compensation_leg/v1, F09 claim statement and registry |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
