# Notification runtime

The package exports `inApp`, `preferences`, and `channels` namespaces for explicit composition. `localNotificationDefinitions(options)` combines the local inbox, its routing subscribers and local preference commands/queries without registering relay commands, channel consent commands or external delivery. Register its `all` definitions with the kernel registry. Supply the unlocked principal, block checks and thread-mute checks from the vault runtime. Drain the kernel outbox to process routed events and preference changes.

`localNotificationBackupCodecs(backupCodec)` accepts the vault's codec factory without depending on the vault package. Add the returned codecs to `openVault` or `vaultFromStorage`. They preserve local inbox, dedupe, counters and preference records. Restore validates the owner of inbox/preferences and rejects security in-app preferences that are disabled. They deliberately carry no channel-consent, relay-mirror or relay-destination state: restored preferences do not authorize external delivery. This extends the existing encrypted alpha backup format, not the future IOX protocol; its codec-set compatibility rules still apply.

## PWA integration

The PWA registers the local definitions, drains the durable outbox on unlock and after commands, and includes notification codecs in encrypted backups. Its inbox shows unread/all pages, an accessible unread count, individual and bulk read actions, and local barter preferences. Security preferences remain enabled. Locking destroys the inbox DOM and its handlers. A failed inbox refresh never reports an already committed domain command as rolled back.

The alpha producer emits `mutiny.coordination.observed` only after a newly accepted signed statement is stored. Recipients come from the verified proposal roster and the actor comes from the verified statement author. Repeated files and rejected signatures produce no new notice. The router suppresses the local user's own actions and the current barter block list. UUID subject IDs support a link to barter coordination; older opaque subject IDs remain usable without alerts. A notification reports local acceptance of evidence, not unanimous consent, payment or settlement.

Retention runs on unlock and the first command after an hour (including clock rollback). The inbox supports 500 retained notifications; pages show 20 rows. External push/email, quiet hours, messaging alerts, full identity lifecycle alerts and complete IOX export remain unfinished. No browser Notification permission or network delivery is requested. The existing alpha keeps local domain records unencrypted at rest.

## Verification

`tests/integration/privacy-notify.test.ts` exercises the public entry points through the kernel bus, preference changes, privacy redaction, absence of sync delivery, encrypted backup roundtrip, foreign-owner rejection and mandatory security preferences. Domain tests cover the three notification modules and two privacy libraries.
