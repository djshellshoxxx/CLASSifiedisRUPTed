# Architecture decision history and client-side defaults — 2026-10-24

**Status:** owner-mandated constraint plus engineering defaults awaiting independent review. Earlier proposals remain at `39ac847`; this supersedes active interpretation while preserving history. Authority: [ARCH-001..010](CLIENT_SIDE_ARCHITECTURE.md). Delegated choices do not mean audited security or approved process specs.

| ADR | Old disposition | Current decision / rationale | Failure / rollback |
|---|---|---|---|
| ADR-0001 | product API/SQL backend REJECTED | static PWA, client-owned vault, no mandatory product service | storage failure prevents acknowledged write; no backend fallback |
| ADR-0002 | centralized event authority SUPERSEDED | local record owner, atomic receipt/event transaction; signed exchange provenance | known cross-vault forks quarantine; revision is not global exclusivity |
| ADR-0003 | bounded search RETAINED | deterministic simple cycles 2..8, explicit incomplete result | no false no-match on truncation; larger limits require review |
| ADR-0004 | server federation inbox SUPERSEDED | signed public interchange via file/chosen transport; no presumed ActivityPub compatibility | invalid input quarantined; crypto profile review gate |
| ADR-0005 | claims vs verification RETAINED | claim, acknowledgement and named external observation distinct | source outage/reorg unknown/revoked; receipt never means settlement |
| ADR-0006 | coarse geography RETAINED | exact address local/private; explicit recipient disclosure | forbidden-field export rejected; sparse-region review required |
| ADR-0007 | central retention/holds SUPERSEDED | local retention/export, no hidden off-device backups or product legal holds | cannot erase copied data/recover lost keys; per-category contracts needed |
| ADR-0008 | server ACK gates local writes REJECTED | local commits offline; delivery/acceptance independent | no fabricated peer consent |
| ADR-0009 | external rental claims RETAINED | no custody; local schedule and deposit evidence | no global booking exclusivity/automatic release |
| ADR-0010 | account sessions before portable keys REJECTED | local key principal from start; pseudonym display only | no product reset service; reviewed recovery/key lifecycle required |
| ADR-0011 | integer money RETAINED | same-currency claims baseline; pinned rational FX only after source/rounding review | expired/absent quote fails; no canonical float amounts |
| ADR-0012 | unanimous consent RETAINED; atomic multi-owner lock REJECTED | signed revision-bound commitments; each vault controls own local reservation | known equivocation freezes coordination; physical recovery voluntary |
| ADR-0013 | server-readable messages REJECTED | local drafts; send gated on vetted device encryption/key protocol | PROTOCOL_NOT_REVIEWED; no plaintext fallback/improvised E2EE |
| ADR-0014 | central tenant/account SQL authority REJECTED | local principal/vault isolation, no global admin | local policy cannot constrain malicious remote client |
| ADR-0015 | chain-specific verification RETAINED | explicitly selected source/network/finality/reorg policy | unreviewed rail or self-supplied hash never verified |
| ADR-0016 | NEW owner mandate | entire CLASS client-side; external dependencies explicit/optional | legacy F15 02_backend path is identifier only, no exception |

## Review record

Integration owner: replacement Codex task. Feature IDs are logical owners, not invented human approvals. Independent review must name reviewer, exact tree/commit, findings and evidence. Architecture review does not approve 1,480 process contracts. Actual owner/source choices remain in [DECISIONS.md](../DECISIONS.md); a gate is not an approved deferral.
