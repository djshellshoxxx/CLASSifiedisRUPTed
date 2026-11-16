import { appError, defineCommand, err, ok, z, type RepoDef } from '@classrup/kernel';
import { inAppDefinitions, notificationRepo, seenRepo, dayRepo, diagRepo, type InAppOptions } from './delivery/inapp/index.ts';
import { prefDefinitions, preferenceRepo, counterRepo } from './preferences/in/index.ts';

/** Local inbox composition. Does not register channel consent, relay or external delivery commands. */
export function localNotificationDefinitions(options: InAppOptions) {
  const unavailable = async (): Promise<never> => { throw new Error('External notification delivery is not configured'); };
  const inbox = inAppDefinitions(options);
  const preferences = prefDefinitions({ localPrincipal: options.localPrincipal, signStatement: unavailable, verifyStatement: unavailable });
  const sweep = defineCommand({ name: 'notify.notification.sweep', module: 'F13.S01.M03', capability: 'notify.notification.mark_read',
    idempotent: false, input: z.strictObject({}), handler(ctx) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      return ok(inbox.sweepNotifications(ctx));
    } });
  return { inbox, preferences, sweep, all: [...inbox.all, preferences.set, preferences.reset, preferences.getMatrix, sweep] as const };
}

/** Structural codec interface avoids a dependency from the notification domain to the vault composition layer. */
interface Codec {
  readonly type: string;
  parse(input: unknown): unknown;
  indexes(input: unknown): readonly [string | null, string | null, string | null, string | null];
  restoreData?(input: unknown, principal: string): Promise<unknown>;
}
type CodecFactory = <T, K extends string>(repo: RepoDef<T, K>) => Codec;

/** Pass the vault's backupCodec factory. No relay mirrors, channel consents, destinations or unsubscribe tokens are restored. */
export function localNotificationBackupCodecs(factory: CodecFactory): readonly Codec[] {
  const owned = <T extends { userDid: string }, K extends string>(repo: RepoDef<T, K>): Codec => ({
    ...factory(repo),
    async restoreData(input, principal) {
      const data = repo.schema.parse(input);
      if (data.userDid !== principal) throw new Error('Notification backup belongs to another principal');
      return data;
    },
  });
  return [owned(notificationRepo), owned(preferenceRepo), factory(seenRepo), factory(dayRepo), factory(diagRepo), factory(counterRepo)];
}
