# PS-094-07 — Privacy, retention and abuse: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-07.R01** Reporter key and details are P2 between the reporter and the addressed relay's moderation role, travel only in the report statement to that relay (details sealed), and never appear in federation payloads, public projections, events or logs.
- **PS-094-07.R02** Reports are retained under RET-EVIDENCE; on the relay the retention is the relay's published policy, never less than the case duration.
- **PS-094-07.R03** Report abuse (mass reporting, retaliation, spoofed outcomes, forwarded reports) is limited by per-key and per-prefix relay caps, dedupe, relay binding, signature checks and local-only effects of advisories.
- **PS-094-07.R04** A report on a P2 target (message, offer, cycle_proposal) carries only metadata (targetCid, sender key, sender signature, reason) by default; plaintext travels only in a participant disclosure the reporter approved after a redacted preview (F12.S01.M02), and the sheet warns that the reported party can infer who reported a private message.
- **PS-094-07.R05** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying every Report and AdvisorySubscription field per F10.S02.M02, and consuming privacy.deletion.completed.
- **PS-094-07.R06** Local hides are P3 device-only preferences that are never synced, sent, logged or shown to anyone, are applied only at query time in the owner's vault, and are included in the owner's export and removed by the owner's deletion.

## Specification

**Data classification**
- Report statement header (reportId, relayId, reporterKey, subjectKey, target, reasonCode): P2 (reporter; moderation role of the addressed relay).
- details and evidence body: P2 sealed to the relay moderation key; untrusted content for moderators.
- Local-only Report fields (hideLocally, block choice, syncState): P3, never sent.
- AdvisorySubscription: P3 (device only); reveals the user's moderation preferences so it is never synced.
- LocalHide: P3 (device only); reveals what the user chose not to see, so it is never synced or sent.
- Message key K in a report: P2 sealed to the addressed relay's moderation key, only in a participant disclosure whose preview removed nothing.

**Retention**
- Resolved and withdrawn reports in the vault: RET-EVIDENCE (2 years after last related activity) through the RetentionPurgePort; the user may delete earlier from the vault.
- Relay copy: per relay policy, default RET-EVIDENCE; signed withdrawal statements from the reporter erase the sealed details when no case is open.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Mass reporting to take down a competitor's listing | relay caps 20 reports per 24 h per key and 60 per /24 prefix, no automatic removal from report count alone, human or deterministic rule decides on that relay only |
| T02 | Reported party deduces the reporter | relay policy omits reporter from notices, events and case records; the UI states that the relay operator can see the reporting key and pseudonymity is not anonymity; reporters may use a fresh per-relay device key |
| T03 | Forged outcome statement shows 'content removed' to the reporter | outcomes accepted only with valid relay signature over the report id and digest; invalid ones are quarantined |
| T04 | Malicious advisory feed hides a competitor's listings in many vaults | advisories are opt-in per publisher, show the publisher name, can be undone, expire, can be retracted, and have local effect only |
| T05 | Report details used to smuggle links or private data to moderators | details is plain text capped at 1000 code points, links rendered inert, scanned by F12.S02.M02 |
| T06 | Relay replays an old receipt to fake acknowledgement | receipts bind reportId, statementDigest and a relay sequence number; replay of a stale sequence is rejected |
| T07 | A relay forwards a signed report to other relays, exposing the reporter key and multiplying reports | signed relayId and sealing key bind the report to one relay (V09); reportId is deduplicated for the life of the report |
| T08 | Reporting a private message leaks third-party plaintext or reveals the reporter | metadata-only by default, redacted participant disclosure only after explicit approval, inference warning on the sheet |
| T09 | Stale labels after an appeal overturn or expiry | advisories carry expiresAt and are removed on verified retraction or expiry |
| T10 | Message key in a report leaks redacted or unreported plaintext | K is sealed only with an unredacted participant disclosure (V12); metadata_only and redacted disclosures never carry K |
| T11 | Fabricated plaintext attributed to a sender in a message report | the relay checks the signed key commitment and Dec(K, C) = P before showing commitment verified; without K the copy is labelled not checkable |

**Abuse controls**
- Bad-faith control: each report a relay dismissed (case closed no_action) produces moderation.report.dismissed; F12.S03.M02 records report_dismissed_bad_faith only once a key reaches 5 non-exempt dismissals in 30 days, and F12.S03.M03 then serves that key from class report.receive.reduced (3 per 24 h); minor_safety reports are exempt.
- Vault UX throttle: more than 10 reports per hour from one vault asks for confirmation (F12.S03.M03 local guard, convenience only, not security).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T11 | abuse | PS-094-07.R03 | 21 reports by one key in 24 h; key with a report_dismissed_bad_faith signal files a 4th in 24 h; same key files minor_safety | 21st and 4th return RATE_LIMITED; minor_safety accepted |
| TEST-PS-094-09.T20 | abuse | PS-094-07.R01 | privacy suite after filing reports: scan federation payloads, public projections, relay logs, events and subject-facing statements | no reporterKey, details or snapshot body appears in any of them |
| TEST-PS-094-09.T21 | abuse | PS-094-07.R04 | report an end-to-end message without disclosure, then with an approved redacted disclosure | relay receives only targetCid, sender key, sender signature and reason, then only the approved redacted bytes; the sheet shows the inference warning |
| TEST-PS-094-09.T22 | integration | PS-094-07.R02, PS-094-07.R05 | injected clock past RET-EVIDENCE for a resolved report; privacy.deletion.completed with keepEvidence true and false; relay DeletionPort applied | report purged through RetentionPurgePort; reporterKey pseudonymized or reports deleted; relay copy pseudonymized; export section listed before deletion |
| TEST-PS-094-09.T29 | abuse | PS-094-07.R06 | F12 privacy suite after hides and unhides: scan sync outbox, relay requests, federation payloads, logs and notifications; export and delete the vault | no LocalHide field appears anywhere outside the vault; section moderation.hides exported; rows deleted with the vault |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
