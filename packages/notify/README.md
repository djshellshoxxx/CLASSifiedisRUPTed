# Notification runtime

The package exports `inApp`, `preferences`, and `channels` namespaces for explicit composition. `localNotificationDefinitions(options)` combines the local inbox, its routing subscribers and local preference commands/queries without registering relay commands, channel consent commands or external delivery. Register its `all` definitions with the kernel registry. Supply the unlocked principal, block checks and thread-mute checks from the vault runtime. Drain the kernel outbox to process routed events and preference changes.

`localNotificationBackupCodecs(backupCodec)` accepts the vault's codec factory without depending on the vault package. Add the returned codecs to `openVault` or `vaultFromStorage`. They preserve local inbox, dedupe, counters and preference records. Restore validates the owner of inbox/preferences and rejects security in-app preferences that are disabled. They deliberately carry no channel-consent, relay-mirror or relay-destination state: restored preferences do not authorize external delivery. This extends the existing encrypted alpha backup format, not the future IOX protocol; its codec-set compatibility rules still apply.

## Current PWA integration boundary

The current alpha emits `mutiny.coordination.changed` with `{subjectId,status}`, `mutiny.want.retained`, `bazaar.listing.changed`, and `bazaar.inventory.changed`. These are not the canonical routed events in `delivery/inapp/routing.ts`. Merely registering the notification router will not turn those into notifications. A composition adapter must re-read verified coordination state, establish local recipient membership, map supported transitions to canonical events carrying participant DIDs and validated references, and distinguish remote actions from the user's own actions. An adapter must not interpret a local coordination change as independent peer consent or completed settlement.

The PWA still needs the inbox/preferences screens, renderers, accessible unread announcements and retention scheduler. External push/email, codec integration for images, complete IOX export, and relay scheduling remain separate unfinished work. No browser Notification permission or network delivery is requested by the local composition.

## Verification

`tests/integration/privacy-notify.test.ts` exercises the public entry points through the kernel bus, preference changes, privacy redaction, absence of sync delivery, encrypted backup roundtrip, foreign-owner rejection and mandatory security preferences. Domain tests cover the three notification modules and two privacy libraries.
