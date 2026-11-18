# F04.S02.M03 — fraud

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead. **Parent:** F04.S02.

## Purpose and business behavior
Detect and record auction-integrity signals that suggest shill bidding by seller-linked accounts, colluding bid rings, and duplicate or Sybil accounts bidding on one auction. Route aggregated evidence to a moderator case. Signals are advisory: this module never rejects a bid, suspends an account or changes an auction result on its own. A moderator records a `dec_` decision; 04_Auctions/01_auction_lifecycle/mod_close reads upheld decisions.

## User stories
- As a bidder, I see that my auction is under review and which rule family applies, without seeing other bidders' identities.
- As a moderator, I review a case with its signals and record a decision with a reason code.
- As an operator, I disable one rule version without disabling bidding or other auction-integrity modules.

## Scope
- Four rules: SELLER_LINK, CO_BID_CLUSTER, DEVICE_OVERLAP, NEW_ACCOUNT_BURST.
- Signal records, case lifecycle, moderator commands, retention, rule versioning.
- Out of scope: bid acceptance (01_auction_lifecycle/mod_bids), close rules (mod_close), last-window timing (02_auction_integrity/mod_sniping), payments and claims (F09).

## Public interfaces
Commands `fraud.signal.record`, `fraud.case.*`; queries `fraud.case.get`, `fraud.aggregate.get`; events `fraud.*`; errors `FRAUD.*`; capabilities `fraud.record`, `fraud.review`, `fraud.decide`, `fraud.escalate`, `fraud.read_aggregate`, `fraud.read_own_outcome`. Details in PS-037-04 and PS-037-05.

## Relationships, dependencies and integration
Upstream: 01_auction_lifecycle/mod_bids (bid events), F07 pseudonymous accounts, F16 capabilities, F15 event envelope. Downstream: F12 moderation cases and appeals, mod_close (reads decisions), F10 subject access. Boundary to confirm: 02_auction_integrity/mod_anti (outside this scope) must not also classify bid timing or shill patterns.

## Data ownership
Owns FraudSignal, FraudCase and RuleVersion records. Does not own bids, accounts, decisions (`dec_` owned by F16 decision log) or moderator identities.

## Risk considerations
False positives on shared households or carrier-grade NAT devices penalize legitimate bidders. Collusion across separate devices evades DEVICE_OVERLAP. Unrotated device keys enable linkage. Signals used across auctions can deanonymize bidders (graph analysis). Moderator conflict of interest. Late or replayed bid events skew scores. Pseudonyms do not guarantee anonymity. No platform custody of money, so a fraud signal never holds funds.

## Completion criteria
PS-037-01 to PS-037-10 SPEC-DRAFT-COMPLETE; fixtures for all four rules; boundary with mod_anti resolved; privacy and security review scheduled (not claimed as done).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-037-01
- [x] [validation_rules.md](validation_rules.md) — PS-037-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-037-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-037-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-037-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-037-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-037-07
- [x] [observability_performance.md](observability_performance.md) — PS-037-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-037-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-037-10
