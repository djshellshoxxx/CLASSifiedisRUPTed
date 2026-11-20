# Full production-registry recovery: follow-up source review

## Result and exact source

**The added assertion closes the dedupe-pointer oracle limitation recorded in the [original source review](SOURCE-REVIEW.md). No blocking issue was identified in this follow-up.** This conclusion applies to the new source below; the original review remains an unchanged record of its earlier source.

| Item | Exact identity |
| --- | --- |
| Reviewed commit | `4a693cba0483b92b0df2459f8c9794be202b7c9a` |
| Reviewed tree | `bccd3e4c94abfc05f2c39d0072264e6f14a9df6b` |
| Parent / originally reviewed source | `99cce1075e066acaefd863d59d23a6fea51f988c` |
| Test file | [production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts) |
| New test Git blob | `e20a7a52747d2c483ffddb3ca652dd744459f832` |
| New test SHA-256 | `b1288b48efa8259e82fca9b73960b334056e32c513e9040f0db8c3ed889f22f8` |
| New test size | 35,256 bytes |
| Review date | 2026-11-20 |

The complete commit diff from the parent contains only one added assertion line in the test. Removing that exact line from the new file reproduces the parent's test bytes. No production, dependency, workflow, configuration, or other test file changed. The reviewed working-tree executable files matched the commit.

## Oracle limitation closed

The added assertion is:

```ts
for (const row of beforeNotifications.seen) expect(row.data).toEqual({ notificationId: notice.id, at: clock.iso() });
```

It independently establishes the semantic link that previously depended on inspection of the [notification producer](../../../../packages/notify/src/delivery/inapp/index.ts): each consumed peer event's dedupe record points to the actual inbox item and records the delivery time from the fixture's clock.

The assertion is not vacuous. The existing fixture requires exactly two captured peer observations, then requires the complete list of dedupe record IDs to equal those event IDs. It also requires exactly one inbox item whose `sourceEventIds` equal those observations. The new loop therefore checks both dedupe payloads against that independently obtained item ID. The expected timestamp is the same unchanged fake clock used by the real dispatcher and by the producer's `markSeen` operation.

The existing full-record and notification-state comparisons then preserve these explicitly checked payloads through encrypted restore, lock/reopen, both matching-enabled refreshes, and ordinary continuation. The new expectation neither calls a restore codec nor computes its expected pointer from the dedupe payload being tested. It strengthens the acceptance oracle without changing evidence admission, normalization, delivery, signing, or inventory behavior.

## Preservation and limits

The exact one-line comparison preserves all findings concerning the unchanged fixture from the [original review](SOURCE-REVIEW.md): real evidence and subscriber routing, full 15-type recovery, the two explicit normalization exceptions, healthy drain checks, detection of duplicate collapses, ordinary owner continuation, original assertions, six unchanged view cases, cleanup, and the 30-second lifecycle cap.

The original review itself is byte-preserved with SHA-256 `164c9cc087fa0954fe269ee9fa8dc78a616bfdafb5da1cb3327314ca9d9c124f`. Its statement about the former pointer gap remains historical; this follow-up closes that specific limitation at the new commit. Its other scope limits remain: domain-record recovery over fake IndexedDB, no kernel queue migration, no native-browser qualification, and no coverage claim for every state of every codec. Historical readiness statuses and gates are unchanged.

This review used read-only Git/source inspection and an exact byte comparison. No compiler, product tests, browser runs, probes, or vulnerability reproduction were performed, and only this follow-up report was written. The original execution receipts remain associated with `99cce1075e066acaefd863d59d23a6fea51f988c`; they are not reassigned to this changed test. The integration lane's repeated TypeScript and nine-case recovery selection supplies separate execution evidence for `4a693cba0483b92b0df2459f8c9794be202b7c9a`.
