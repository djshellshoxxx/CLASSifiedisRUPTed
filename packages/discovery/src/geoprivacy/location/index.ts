// F06.S02.M02: vault-local coarse preferences only. Precise sharing needs authenticated private transport.
import { appError, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, timestamp, uuidv7, z,
  type CommandContext, type HandlerContext, type RepoDef, type StoredRecord } from '@classrup/kernel';
import { discoveryGeoErrors } from '../coarse/index.ts';

const MODULE = 'F06.S02.M02';
const DAY_MS = 86_400_000;
const cell5 = z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{5}$/);
const level = z.enum(['L0', 'L1', 'L2']);
const mode = z.enum(['map_tile', 'gazetteer', 'device_gps_once']);
export type PublicLocationLevel = z.output<typeof level>;

export const locationErrors = defineErrors({ DISCOVERY_HOME_CHANGE_LIMIT: { status: 429, retryable: false } });
/** changeTimes is bounded rolling-window state; counts alone cannot enforce a sliding 24-hour limit. */
export const locationSettingSchema = z.strictObject({
  settingId: uuidv7(), ownerDid: z.string().startsWith('did:key:').max(128),
  homeCell5: cell5.optional(), publicLevel: level, entryMode: mode,
  changeCount24h: z.int().min(0).max(3), changeTimes: z.array(timestamp()).max(3),
  lastChangedAt: timestamp().optional(),
}).refine(v => v.homeCell5 !== undefined || v.publicLevel === 'L0')
  .refine(v => v.changeCount24h === v.changeTimes.length)
  .refine(v => v.changeTimes.every((time, i) => (i === 0 || time >= v.changeTimes[i - 1]!)
    && v.lastChangedAt !== undefined && time <= v.lastChangedAt));
export type LocationSetting = z.output<typeof locationSettingSchema>;
/** Canonical key is the owner DID, with a separate UUIDv7 settingId. One row per vault principal. */
export const locationSettingRepo = defineRepo({ type: 'discovery.location_setting', schema: locationSettingSchema, indexes: {} });

export function publicLocationCell(value: Pick<LocationSetting, 'homeCell5' | 'publicLevel'>): string | undefined {
  return value.homeCell5 === undefined || value.publicLevel === 'L0' ? undefined
    : value.homeCell5.slice(0, value.publicLevel === 'L1' ? 4 : 5);
}
export const locationUpdated = defineEvent('discovery.location.updated', 1, 'P1', z.strictObject({
  settingId: uuidv7(), publicLevel: level, publicCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(), revision: z.int().positive(),
}).refine(v => v.publicLevel === 'L0' ? v.publicCell === undefined : v.publicCell?.length === (v.publicLevel === 'L1' ? 4 : 5)));

export interface LocationView {
  readonly settingId?: string; readonly publicLevel: PublicLocationLevel; readonly publicCell?: string;
  readonly homeCell5?: string; readonly revision?: number;
}
function view(row: StoredRecord<LocationSetting> | undefined, includeHome = false): LocationView {
  if (!row) return { publicLevel: 'L0' };
  const publicCell = publicLocationCell(row.data);
  return { settingId: row.data.settingId, revision: row.revision, publicLevel: row.data.publicLevel,
    ...(publicCell !== undefined ? { publicCell } : {}),
    ...(includeHome && row.data.homeCell5 !== undefined ? { homeCell5: row.data.homeCell5 } : {}) };
}

export function locationDefinitions(options: { localPrincipal(): string }) {
  const owner = (ctx: HandlerContext): string | undefined => {
    const principal = options.localPrincipal();
    return ctx.actor.kind === 'user' && ctx.actor.id === principal && ctx.tenantId === principal ? principal : undefined;
  };
  function store(ctx: CommandContext, principal: string, previous: StoredRecord<LocationSetting> | undefined, data: LocationSetting) {
    const saved = ctx.tx.repo(locationSettingRepo).put(principal, data, { expectedRevision: previous?.revision ?? 0 });
    if (!saved.ok) return saved;
    const projection = view(saved.value);
    ctx.emit(locationUpdated, { aggregate: { type: 'location_setting', id: data.settingId }, revision: saved.value.revision,
      payload: { settingId: data.settingId, revision: saved.value.revision, publicLevel: data.publicLevel,
        ...(projection.publicCell !== undefined ? { publicCell: projection.publicCell } : {}) } });
    return ok(projection);
  }
  const setHome = defineCommand({ name: 'discovery.location.set_home', module: MODULE,
    capability: 'discovery.location_setting.write_own', idempotent: true,
    input: z.strictObject({ cell5: z.string().max(128).optional(), publicLevel: z.string().max(8), entryMode: mode,
      fromGpsOnce: z.boolean().optional(), expectedRevision: z.int().min(0).optional() })
      .refine(v => v.fromGpsOnce !== true || v.entryMode === 'device_gps_once'),
    handler(ctx, input) {
      const principal = owner(ctx); if (!principal) return err(appError('FORBIDDEN'));
      const selectedLevel = level.safeParse(input.publicLevel);
      if (!selectedLevel.success || (input.cell5 !== undefined && !cell5.safeParse(input.cell5).success)
        || (input.cell5 === undefined && selectedLevel.data !== 'L0')) return err(discoveryGeoErrors.make('DISCOVERY_PRECISION_FORBIDDEN'));
      const previous = ctx.tx.repo(locationSettingRepo).get(principal);
      if (previous && previous.data.ownerDid !== principal) return err(appError('FORBIDDEN'));
      // Creation may omit the revision. Updating an existing preference must always bind its revision.
      if ((input.expectedRevision ?? 0) !== (previous?.revision ?? 0)) return err(appError('CONFLICT_REVISION'));
      const before = previous?.data;
      if (before && before.homeCell5 === input.cell5 && before.publicLevel === input.publicLevel && before.entryMode === input.entryMode) return ok(view(previous));
      const now = Math.max(ctx.clock.now(), before?.lastChangedAt ? Date.parse(before.lastChangedAt) : -Infinity);
      const recent = (before?.changeTimes ?? []).filter(time => Date.parse(time) > now - DAY_MS);
      const changingHome = input.cell5 !== undefined && input.cell5 !== before?.homeCell5;
      // Hiding/clearing always remains possible at saturation. Neither operation resets the guard.
      if (changingHome && recent.length >= 3) return err(locationErrors.make('DISCOVERY_HOME_CHANGE_LIMIT'));
      const lastChangedAt = changingHome ? new Date(now).toISOString() : before?.lastChangedAt;
      const changeTimes = changingHome ? [...recent, lastChangedAt!] : recent;
      const data: LocationSetting = { settingId: before?.settingId ?? ctx.ids.next(), ownerDid: principal,
        ...(input.cell5 !== undefined ? { homeCell5: input.cell5 } : {}), publicLevel: selectedLevel.data,
        entryMode: input.entryMode, changeTimes, changeCount24h: changeTimes.length,
        ...(lastChangedAt !== undefined ? { lastChangedAt } : {}) };
      return store(ctx, principal, previous, data);
    },
  });
  const clearHome = defineCommand({ name: 'discovery.location.clear_home', module: MODULE,
    capability: 'discovery.location_setting.write_own', idempotent: true,
    input: z.strictObject({ expectedRevision: z.int().positive() }),
    handler(ctx, input) {
      const principal = owner(ctx); if (!principal) return err(appError('FORBIDDEN'));
      const previous = ctx.tx.repo(locationSettingRepo).get(principal);
      if (!previous) return err(appError('NOT_FOUND'));
      if (previous.data.ownerDid !== principal) return err(appError('FORBIDDEN'));
      if (input.expectedRevision !== previous.revision) return err(appError('CONFLICT_REVISION'));
      if (previous.data.homeCell5 === undefined && previous.data.publicLevel === 'L0') return ok(view(previous));
      const { homeCell5: _removed, ...rest } = previous.data;
      return store(ctx, principal, previous, { ...rest, publicLevel: 'L0' });
    },
  });
  const getOwn = defineQuery({ name: 'discovery.location.get_own', module: MODULE, capability: 'discovery.location_setting.read_own',
    input: z.strictObject({ includeHomeCell: z.boolean().optional() }),
    handler(ctx, input) {
      const principal = owner(ctx); if (!principal) return err(appError('FORBIDDEN'));
      const row = ctx.tx.repo(locationSettingRepo).get(principal);
      if (row && row.data.ownerDid !== principal) return err(appError('FORBIDDEN'));
      return ok(view(row, input.includeHomeCell));
    },
  });
  return { setHome, clearHome, getOwn, all: [setHome, clearHome, getOwn] as const };
}

interface Codec {
  readonly type: string; parse(input: unknown): unknown;
  indexes(input: unknown): readonly [string | null, string | null, string | null, string | null];
  recordId?(input: unknown): string; restoreData?(input: unknown, principal: string): Promise<unknown>;
}
/** Settings only. Strict parsing rejects finer cells, address/coordinate fields and forged ownership. */
export function locationBackupCodecs(factory: <T, K extends string>(repo: RepoDef<T, K>) => Codec): readonly Codec[] {
  return [{ ...factory(locationSettingRepo),
    recordId(input) { return locationSettingSchema.parse(input).ownerDid; },
    async restoreData(input, principal) {
      const data = locationSettingSchema.parse(input);
      if (data.ownerDid !== principal) throw new Error('Location backup belongs to another principal');
      // The documented import policy resets the local anti-probing window; it is not a network security boundary.
      const { lastChangedAt: _removed, ...rest } = data;
      return { ...rest, changeCount24h: 0, changeTimes: [] };
    },
  }];
}
