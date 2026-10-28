/**
 * F07.S02.M02 profiles: display name, bio, avatar attachment ref, languages and a coarse home
 * `regionCell`. Each field carries its own visibility; every read path filters through it, so a
 * public DTO can never contain a participants-only or private field.
 */
import type { CommandContext } from '@classrup/kernel';
import { assertPublicCell, assertVersion, notFound, parse, runCommand, schemas, validationError, z } from '@classrup/kernel';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, deriveId, EVENTS, event, FLAGS, ownerRef } from '../env';
import type { ProfileField, ProfileRecord, Visibility } from '../records';
import { PROFILE_FIELDS } from '../records';
import { accountIdSchema, expectedVersionSchema } from '../schemas';

export type ViewerRelation = 'self' | 'participant' | 'public';

export const DEFAULT_VISIBILITY: Readonly<Record<ProfileField, Visibility>> = {
  displayName: 'public',
  bio: 'public',
  avatarRef: 'public',
  languages: 'public',
  regionCell: 'participants',
};

export interface ProfileDto {
  readonly accountId: string;
  readonly pseudonym: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly avatarRef?: string;
  readonly languages?: readonly string[];
  readonly regionCell?: string;
  /** Present for the owner only. */
  readonly visibility?: Readonly<Record<ProfileField, Visibility>>;
  readonly version: number;
}

export function isVisibleTo(visibility: Visibility, relation: ViewerRelation): boolean {
  if (relation === 'self') return true;
  return visibility === 'public' || (visibility === 'participants' && relation === 'participant');
}

const hasValue = (profile: ProfileRecord, field: ProfileField): boolean => {
  const value = profile[field];
  return Array.isArray(value) ? value.length > 0 : value !== undefined;
};

/** Projects a stored profile for one viewer. Unset fields are omitted rather than nulled. */
export function projectProfile(profile: ProfileRecord, pseudonym: string, relation: ViewerRelation): ProfileDto {
  const shown = PROFILE_FIELDS.filter((f) => hasValue(profile, f) && isVisibleTo(profile.visibility[f], relation));
  const pick = <F extends ProfileField>(field: F): Pick<ProfileDto, F> | Record<string, never> =>
    shown.includes(field) ? ({ [field]: profile[field] } as Pick<ProfileDto, F>) : {};
  return {
    accountId: profile.accountId,
    pseudonym,
    ...pick('displayName'),
    ...pick('bio'),
    ...pick('avatarRef'),
    ...pick('languages'),
    ...pick('regionCell'),
    ...(relation === 'self' ? { visibility: profile.visibility } : {}),
    version: profile.version,
  };
}

const visibilitySchema = z.enum(['public', 'participants', 'private']);
export const languageSchema = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'expected a BCP 47 language tag');

const updateSchema = z
  .object({
    displayName: schemas.text(1, 50).nullable().optional(),
    bio: schemas.text(0, 500).nullable().optional(),
    avatarRef: schemas.id('att').nullable().optional(),
    languages: z.array(languageSchema).max(8).optional(),
    regionCell: z.string().max(12).nullable().optional(),
    visibility: z.object({ displayName: visibilitySchema, bio: visibilitySchema, avatarRef: visibilitySchema, languages: visibilitySchema, regionCell: visibilitySchema }).partial().strict().optional(),
    expectedVersion: expectedVersionSchema,
  })
  .strict();
const getSchema = z.object({ accountId: accountIdSchema.optional() }).strict();

export interface ProfileService {
  update(ctx: CommandContext, input: z.input<typeof updateSchema>): ProfileDto;
  get(ctx: CommandContext, input?: z.input<typeof getSchema>): ProfileDto;
}

export function emptyProfile(accountId: string, tenantId: string, now: number): Omit<ProfileRecord, 'version'> {
  return { id: deriveId('prof', accountId), tenantId, accountId, languages: [], visibility: DEFAULT_VISIBILITY, imports: [], updatedAt: now };
}

export function createProfileService(env: IdentityEnv): ProfileService {
  const { deps, stores, ports } = env;

  function applyUpdate(base: ProfileRecord | Omit<ProfileRecord, 'version'>, i: z.output<typeof updateSchema>, now: number) {
    const next: Record<string, unknown> = { ...base, updatedAt: now };
    const changed: ProfileField[] = [];
    const set = (field: ProfileField, value: unknown): void => {
      next[field] = value === null ? undefined : value;
      changed.push(field);
    };
    if (i.displayName !== undefined) set('displayName', i.displayName);
    if (i.bio !== undefined) set('bio', i.bio === '' ? null : i.bio);
    if (i.avatarRef !== undefined) set('avatarRef', i.avatarRef);
    if (i.languages !== undefined) set('languages', [...new Set(i.languages)]);
    if (i.regionCell !== undefined) set('regionCell', i.regionCell === null ? null : assertPublicCell(i.regionCell));
    if (i.visibility !== undefined) {
      next.visibility = { ...base.visibility, ...i.visibility };
      for (const f of Object.keys(i.visibility) as ProfileField[]) if (!changed.includes(f)) changed.push(f);
    }
    if (changed.length === 0) throw validationError('IDENTITY.PROFILE_EMPTY_UPDATE', 'no profile field supplied');
    return { record: next as unknown as Omit<ProfileRecord, 'version'>, changed };
  }

  return {
    update(ctx, input) {
      const i = parse(updateSchema, input);
      authorize(env, ctx, 'identity.profile:update', ownerRef('profile', ctx.actor.id, ctx.actor.tenantId, deriveId('prof', ctx.actor.id)));
      return runCommand(deps, ctx, { name: 'identity.profile.update', flag: FLAGS.profiles, request: i }, () => {
        const account = stores.accounts.get(ctx.actor.id);
        if (!account || account.tenantId !== ctx.actor.tenantId || account.status !== 'active') {
          throw notFound('IDENTITY.ACCOUNT_NOT_FOUND', 'account not found');
        }
        const now = deps.clock.now();
        const current = stores.profiles.get(deriveId('prof', account.id));
        assertVersion('profile', current?.version ?? 0, i.expectedVersion);
        const { record, changed } = applyUpdate(current ?? emptyProfile(account.id, account.tenantId, now), i, now);
        const stored = stores.profiles.put(record, current?.version ?? 0);
        return {
          result: projectProfile(stored, account.pseudonym, 'self'),
          // Field names only: values (bio, region) never travel in events.
          events: [event(EVENTS.profileUpdated, 'profile', stored.id, stored.version, { accountId: account.id, changedFields: changed })],
        };
      });
    },

    get(ctx, input = {}) {
      const i = parse(getSchema, input);
      const accountId = i.accountId ?? ctx.actor.id;
      authorize(env, ctx, 'identity.profile:read', { type: 'profile', tenantId: ctx.actor.tenantId, id: deriveId('prof', accountId), ownerId: accountId });
      checkFlag(env, ctx, FLAGS.profiles);
      const account = stores.accounts.get(accountId);
      const self = ctx.actor.id === accountId;
      const hidden = !account || account.tenantId !== ctx.actor.tenantId || (!self && (account.status !== 'active' || ports.blocks.isBlocked(ctx.actor.id, accountId)));
      if (hidden) throw notFound('IDENTITY.PROFILE_NOT_FOUND', 'profile not found');
      const relation: ViewerRelation = self ? 'self' : ctx.actor.kind !== 'anonymous' && ports.relations.isParticipant(ctx.actor.id, accountId) ? 'participant' : 'public';
      const profile = stores.profiles.get(deriveId('prof', accountId)) ?? { ...emptyProfile(accountId, account.tenantId, account.createdAt), version: 0 };
      return projectProfile(profile, account.pseudonym, relation);
    },
  };
}
