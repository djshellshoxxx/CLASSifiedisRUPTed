/**
 * F08.S03.M01 safe meeting spots: moderator-curated public places (name, kind, coarse region cell).
 * No street address and no coordinates are stored: users find the place by name.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertPublicCell, assertVersion, defineOperations, notFound, parse, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import type { Env } from '../support';
import { col, COLLECTIONS, FLAGS } from '../support';
import type { SafeSpot } from '../types';
import { SAFE_SPOT_KINDS } from '../types';

export const SAFETY_TIPS: readonly { readonly id: string; readonly text: string }[] = [
  { id: 'public_place', text: 'Meet in a busy public place, ideally one of the suggested safe spots.' },
  { id: 'daylight', text: 'Prefer daylight hours and tell a friend where you are going.' },
  { id: 'share_plan', text: 'Share your meetup window and safe spot with a trusted contact before you leave.' },
  { id: 'inspect_first', text: 'Inspect the item before paying and never pay in advance for something you have not seen.' },
  { id: 'bring_company', text: 'Bring someone with you for large or high-value exchanges.' },
  { id: 'trust_instincts', text: 'If anything feels wrong, leave. You can cancel a meetup at any time.' },
  { id: 'keep_in_app', text: 'Keep conversation in the app so the record stays with you if there is a dispute.' },
];

const createSchema = z.strictObject({ name: schemas.text(2, 80), kind: z.enum(SAFE_SPOT_KINDS), regionCell: z.string() });
const retireSchema = z.strictObject({ safeSpotId: schemas.id('msp'), expectedVersion: z.number().int().min(0).optional() });
const listSchema = z.strictObject({
  regionCell: z.string().regex(/^[0-9b-hjkmnp-z]{1,5}$/).optional(),
  kind: z.enum(SAFE_SPOT_KINDS).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export interface SafeSpotDto {
  readonly id: string;
  readonly name: string;
  readonly kind: SafeSpot['kind'];
  readonly regionCell: string;
  readonly status: SafeSpot['status'];
  readonly version: number;
}

export const safeSpotDto = (s: SafeSpot): SafeSpotDto => ({ id: s.id, name: s.name, kind: s.kind, regionCell: s.regionCell, status: s.status, version: s.version });

export function createSafeSpots(env: Env) {
  const { deps } = env;
  const spots = () => col<SafeSpot>(env, COLLECTIONS.safeSpots);

  function create(ctx: CommandContext, input: unknown): SafeSpotDto {
    const req = parse(createSchema, input);
    return runCommand(deps, ctx, { name: 'comms.safe_spot.create', flag: FLAGS.safe, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'comms.safe_spot:manage', { type: 'comms.safe_spot', tenantId: actor.tenantId });
      const saved = spots().put(
        {
          id: deps.ids.next('msp'), tenantId: actor.tenantId, name: req.name, kind: req.kind, regionCell: assertPublicCell(req.regionCell),
          status: 'active', createdBy: actor.id, createdAt: deps.clock.now(),
        },
        0,
      );
      return {
        result: safeSpotDto(saved),
        events: [
          { type: 'comms.safe_spot.created', aggregateType: 'safe_spot', aggregateId: saved.id, revision: saved.version, payload: { safeSpotId: saved.id, kind: saved.kind, regionCell: saved.regionCell } },
        ],
      };
    });
  }

  function retire(ctx: CommandContext, input: unknown): SafeSpotDto {
    const req = parse(retireSchema, input);
    return runCommand(deps, ctx, { name: 'comms.safe_spot.retire', flag: FLAGS.safe, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'comms.safe_spot:manage', { type: 'comms.safe_spot', tenantId: actor.tenantId });
      const spot = spots().get(req.safeSpotId);
      if (!spot || spot.tenantId !== actor.tenantId) throw notFound('COMMS.SAFE_SPOT_NOT_FOUND', 'safe spot not found');
      assertVersion('safe spot', spot.version, req.expectedVersion);
      if (spot.status === 'retired') return { result: safeSpotDto(spot) };
      const saved = spots().put({ ...spot, status: 'retired' }, spot.version);
      return {
        result: safeSpotDto(saved),
        events: [{ type: 'comms.safe_spot.retired', aggregateType: 'safe_spot', aggregateId: saved.id, revision: saved.version, payload: { safeSpotId: saved.id } }],
      };
    });
  }

  /** Public: anyone may browse safe spots in their tenant. */
  function list(actor: Actor, input: unknown): { safeSpots: SafeSpotDto[] } {
    const req = parse(listSchema, input ?? {});
    requireFeature(deps.flags, FLAGS.safe, actor.tenantId);
    deps.authz.authorize(actor, 'comms.safe_spot:read', { type: 'comms.safe_spot', tenantId: actor.tenantId });
    const found = spots()
      .list(
        (s) => s.tenantId === actor.tenantId && s.status === 'active' && (req.kind === undefined || s.kind === req.kind) && (req.regionCell === undefined || s.regionCell.startsWith(req.regionCell) || req.regionCell.startsWith(s.regionCell)),
      )
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
      .slice(0, req.limit);
    return { safeSpots: found.map(safeSpotDto) };
  }

  function tips(actor: Actor): { tips: typeof SAFETY_TIPS } {
    requireFeature(deps.flags, FLAGS.safe, actor.tenantId);
    deps.authz.authorize(actor, 'comms.safety:tips', { type: 'comms.safety', tenantId: actor.tenantId });
    return { tips: SAFETY_TIPS };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.safe_spot.create', kind: 'command', flag: FLAGS.safe, summary: 'Moderator: add a public safe meeting spot', handler: create },
    { name: 'comms.safe_spot.retire', kind: 'command', flag: FLAGS.safe, summary: 'Moderator: retire a safe meeting spot', handler: retire },
    { name: 'comms.safe_spot.list', kind: 'query', flag: FLAGS.safe, summary: 'Browse safe meeting spots', public: true, handler: (ctx, input) => list(ctx.actor, input) },
    { name: 'comms.safety.tips', kind: 'query', flag: FLAGS.safe, summary: 'Meetup safety tips', public: true, handler: (ctx) => tips(ctx.actor) },
  ]);

  return { create, retire, list, tips, operations };
}
