# Consistency states and their limits

**Status:** APPROVED with ADR-0016. **Source:** adopted from `planning/CLIENT_SIDE_ARCHITECTURE.md` on branch `docs/client-owned-foundations-20261024` (open PR #2, same repository), wording unchanged. UI labels, sync outbox states (CTR-IDM-001 IDM-7) and evidence views must never claim a stronger state than the table allows.

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

Mapping to sync outbox states: `prepared` = export prepared; `transport_acknowledged` = transport acknowledged; `peer_accepted` = peer accepted. "Locally reserved" is the only reservation guarantee (IDM-8).
