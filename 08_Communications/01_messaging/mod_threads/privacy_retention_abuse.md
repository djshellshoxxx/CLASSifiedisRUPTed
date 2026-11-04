# PS-061-07 — Privacy, retention and abuse: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-07.R01** Thread membership exists only in vaults; the relay sees only per-message sender DID and recipient mailbox (F08.S01.M01), and this is disclosed.
- **PS-061-07.R02** Archived threads and their messages are purged locally 30 days after archive and on vault wipe.
- **PS-061-07.R03** Block enforcement never reveals to the blocked party that a block exists.

## Specification

**Data classification**
- Thread: P2, vault only; the thread-open statement travels as an end-to-end encrypted envelope, so the relay sees only mailbox routing metadata.
- Mute state: P2, visible to the owner only and to the notification router as a boolean.

**Retention**
- Active threads: RET-STANDARD until the user deletes them; archived threads purged locally 30 days after archive.
- When a participant erases their vault the others keep their copy; the roster shows the pseudonym last known, and no remote deletion is claimed.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stalking through repeated new threads after block | a blocker's vault quarantines or drops thread-open statements from blocked DIDs silently so the sender learns nothing; rate limit of 30 new threads per day per vault |
| T02 | Adding an unwanted person to a cycle thread | roster changes only follow mutiny.party.joined events derived from verified signed statements that carry that person's own consent in F02 |
| T03 | Enumeration of who talks to whom | threads exist only in vaults; list and get are local; relay routing metadata is disclosed |
| T04 | Thread spam to many members from one listing | receiving vaults put unknown-sender threads in message requests; a relay may rate limit puts by its hosting policy |

**Abuse controls**
- Local filtering: unknown-sender thread-open statements wait in message requests and the user can block or report; relays apply their own hosting policy.
- Report thread action passes thread ID and participant DIDs to the chosen relay operator or advisory feed (F12.S01.M01); content is attached only by the reporter's decrypted export.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T10 | abuse | PS-061-07.R01, PS-061-07.R03 | blocked party sends thread-open statements | blocker vault drops silently, sender sees no error or signal of a block |
| TEST-PS-061-09.T11 | integration | PS-061-07.R02 | archive then advance clock 30 days | thread and messages purged locally; peers keep their copy |
| TEST-PS-061-09.T12 | abuse | PS-061-07.R03, PS-061-02.R01 | 31st thread creation in a day; thread-open statement signed by a stranger for a listing they do not own | RATE_LIMITED; COMMS_THREAD_OPEN_REJECTED and message-request quarantine |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
