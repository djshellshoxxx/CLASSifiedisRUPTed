# F12.S02.M03 — abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead. **Parent:** F12.S02.

## Purpose and business behavior
Detects interpersonal abuse in platform text: harassment, threats, doxxing patterns (phone, email and address shapes posted about others) and hate terms from a governed lexicon. It also detects misuse of the reporting system itself (sustained invalid reporting). Output is a finding that a reviewer confirms or dismisses. Confirmed findings become enforcement proposals (PS-096). Findings never change visibility on their own.

## User stories
- As a participant, I am not exposed to threats or contact details posted about me without review.
- As a reviewer, I see category, severity and rule for each finding and open text only under a case grant.
- As a reporter whose reports are repeatedly invalid, I am told my reporting is limited and why, in general terms.

## Scope
Ten process specs, all SPEC-DRAFT-COMPLETE: PS-095-01 to PS-095-10 (see inventory below).

## Public interfaces
- Commands: `abuse.scan` (sys), `abuse.review`, `abuse.restrict_reporter`, `abuse.rule.publish`.
- Queries: `abuse.review_queue`, `abuse.finding`, `abuse.rule_precision`.
- Events: `finding.recorded`, `finding.confirmed`, `finding.dismissed`, `account.reporting_restricted`, `account.reporting_restored`.
- Identifier `abf_` (PENDING CTR-ID-001).

## Relationships, dependencies and integration
Upstream: content owners (F08 messages, F01–F05 listings and services), F12.S01.M01 flags (misuse counters), F16 governance. Downstream: F12.S02.M01 enforcement (proposals), F12.S01.M03 appeals, F12.S03.M02 signals (rule precision as signal). Rules are shared with F12.S02.M02 spam only through rule IDs.

## Data ownership
Owns: `abf_` findings, rule registry, reporter-misuse counters. Does not own: content, reports, sanctions. Canonical owner of abuse findings: this module (PROVISIONAL, unapproved).

## Risk considerations
Over-flagging of communities or dialects; rule probing; digest reversal; harassment through the review path; reporter retaliation through restriction abuse. Detection is probabilistic and never self-executing. No platform custody of money; no payment or delivery claim depends on findings.

## Completion criteria
Ten process specs past approval gates (Privacy Lead F10, Security Lead F16, Trust&Safety sign-off); evasion corpus and bias gates defined.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-095-01
- [x] [validation_rules.md](validation_rules.md) — PS-095-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-095-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-095-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-095-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-095-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-095-07
- [x] [observability_performance.md](observability_performance.md) — PS-095-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-095-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-095-10
