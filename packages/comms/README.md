# @classrup/comms (F08)

Private messaging, negotiation cards with signed consent, and safe-meetup coordination. Area `comms`, factory `createComms(deps, ports)`.
The relay stores ciphertext and routing metadata only: end-to-end encryption happens on clients with `encryptMessage` / `decryptMessage` (`@classrup/security` multi-recipient X25519 + XChaCha20-Poly1305, AAD bound to the thread id).

## Module map

| Module | Path | Code |
|---|---|---|
| F08.S01.M01 private | `src/messaging/private.ts`, `src/client.ts` | encrypted send/list, gapless sequence, TTL, receipts |
| F08.S01.M02 threads | `src/messaging/threads.ts` | 2..20 participants, invitations, archive/mute |
| F08.S01.M03 attachments | `src/messaging/attachments.ts`, `src/messaging/strip.ts` | blob metadata, JPEG/PNG metadata stripping |
| F08.S02.M01 offers | `src/negotiation/offers.ts` | negotiation cards |
| F08.S02.M02 consent | `src/negotiation/consent.ts` | signed per-revision consent |
| F08.S03.M01 safe | `src/meetups/safe.ts` | safe spots, tips |
| F08.S03.M02 handoff | `src/meetups/handoff.ts` | check-in, hashed codes, trusted-contact link |
| F08.S03.M03 coordination | `src/meetups/coordination.ts` | meetup proposal/consent/no-show |

## Operations (44)

Permissions are `comms.<aggregate>:<action>`; "member" = active participant of the thread/meetup (deny by default). Commands accept `Idempotency-Key`.

| Operation | Kind | Permission |
|---|---|---|
| comms.thread.create | command | comms.thread:create (authenticated) |
| comms.thread.invite / respond / leave / archive / mute | command | comms.thread:invite / respond / leave / archive / mute (member; respond = invitee) |
| comms.thread.set_disappearing | command | comms.thread:configure (creator) |
| comms.thread.get / list / keys | query | comms.thread:read / list / read |
| comms.message.send | command | comms.message:send (active member) |
| comms.message.list | query | comms.message:read |
| comms.message.delete_for_me | command | comms.message:delete |
| comms.message.expire_due | command | comms.message:purge (system) |
| comms.receipt.set_enabled / mark | command | comms.receipt:write |
| comms.receipt.list | query | comms.receipt:read |
| comms.attachment.register | command | comms.attachment:register |
| comms.attachment.get | query | comms.attachment:read |
| comms.attachment.expire_due | command | comms.attachment:purge (system) |
| comms.card.post / list | command / query | comms.card:post / read |
| comms.consent.record | command | comms.consent:record (own account) |
| comms.consent.status | query | comms.consent:read |
| comms.safe_spot.create / retire | command | comms.safe_spot:manage (moderator, admin) |
| comms.safe_spot.list, comms.safety.tips | query | public |
| comms.meetup.propose | command | comms.meetup:propose |
| comms.meetup.accept / counter / reschedule / cancel | command | comms.meetup:respond |
| comms.meetup.report_no_show | command | comms.meetup:report |
| comms.meetup.expire_due | command | comms.meetup:expire (system) |
| comms.meetup.get / list | query | comms.meetup:read |
| comms.handoff.check_in / set_code / confirm | command | comms.handoff:checkin / code / confirm |
| comms.safety.share / list_shares | command / query | comms.safety:share |
| comms.safety.revoke_share | command | comms.safety:revoke_share (creator) |
| comms.safety.view_share | query | public, bearer token |

## Events

`comms.thread.created`, `comms.thread.configured`, `comms.participant.invited|joined|declined|left`, `comms.message.sent`, `comms.message.purged`, `comms.receipt.marked` (only when the reader opted in), `comms.attachment.registered|expired`, `comms.card.posted`, `comms.consent.recorded`, `comms.safe_spot.created|retired`, `comms.meetup.proposed|accepted|confirmed|countered|rescheduled|cancelled|expired|no_show_reported`, `comms.handoff.checked_in`, `comms.handoff.confirmed_by_code` (bilateral evidence, not proof of delivery), `comms.handoff.code_rejected`, `comms.safety.shared|share_revoked`. Payloads carry ids and public data only.

## Ports

Consumed (`src/ports.ts`): `AccountLookup` (required; status plus signing and box key ids), `BlockPort`, `RateLimitPort` (`comms.send:<actor>`, `comms.invite:<actor>`, `comms.thread_create:<actor>`, `comms.meetup:<actor>`), `NotifyPort` (ids only, never content).
Provided to the relay for other features: `verifyConsent(envelope, expectedAccountId?)`, `hasAllConsent(...)`.
System sweepers to schedule: `comms.message.expire_due`, `comms.attachment.expire_due`, `comms.meetup.expire_due`.

## Collections

`comms_threads`, `comms_participants`, `comms_counters`, `comms_messages`, `comms_read_marks`, `comms_attachments`, `comms_cards`, `comms_consents`, `comms_safe_spots`, `comms_meetups`, `comms_no_shows`, `comms_handoffs`, `comms_shares`.

## Limits

- Key directory is relay-served (trust on first use); sender attribution inside a group is relay-asserted unless the plaintext carries a signature.
- Invitees cannot read or receive messages until they accept; later joiners cannot read earlier messages.
- Card summaries and safe-spot names are relay-visible plaintext: keep them neutral.
- Check-ins, handoff codes and no-show reports are participant claims. A share link bearer token is returned once (its idempotent replay window is 5 minutes).
- WebP and PDF metadata are not stripped; blob storage and virus scanning belong to the relay.
- Subject and card references are validated by id prefix only; existence is not verified.
