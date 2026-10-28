/** F12.S02.M03 abuse: private user blocks (BlockPort) and the multi-reporter harassment pattern. */
import type { BlockPort, CommandContext } from '@classrup/kernel';
import { DAY, parse, precondition, runCommand, schemas, validationError, z } from '@classrup/kernel';
import { anonymized, authorize, event, operation, pageOf } from '../common';
import type { Env } from '../common';
import { INTERPERSONAL_REASONS } from '../reporting/priority';

export const HARASSMENT_WINDOW_MS = 7 * DAY;
export const HARASSMENT_MIN_REPORTERS = 3;
export const MAX_BLOCKS_PER_ACCOUNT = 1000;

const targetSchema = z.object({ accountId: schemas.text(1, 64) });
const listSchema = z.object({ limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) });

export interface BlockDto {
  readonly blockId: string;
  readonly blockedId: string;
  readonly createdAt: number;
}

const indexId = (blockerId: string, blockedId: string): string => `${blockerId}>${blockedId}`;

/** Distinct reporters of interpersonal conduct against one account inside the pattern window. */
export function harassmentPattern(env: Env, accountId: string, now: number): boolean {
  const reporters = new Set<string>();
  for (const r of env.cols.reports.list((x) => x.subjectAccountId === accountId && now - x.createdAt <= HARASSMENT_WINDOW_MS)) {
    if (INTERPERSONAL_REASONS.has(r.reason)) reporters.add(r.reporterId);
  }
  return reporters.size >= HARASSMENT_MIN_REPORTERS;
}

export function createAbuse(env: Env) {
  const exists = (blockerId: string, blockedId: string): boolean => env.cols.blockIndex.get(indexId(blockerId, blockedId)) !== undefined;

  /** Bidirectional: true when either account blocked the other. Never exposed to the blocked party. */
  const blocks: BlockPort = { isBlocked: (a, b) => exists(a, b) || exists(b, a) };

  const ownBlocks = (blockerId: string, tenantId: string) =>
    env.cols.blocks.list((b) => b.blockerId === blockerId && b.tenantId === tenantId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  const toDto = (b: { id: string; blockedId: string; createdAt: number }): BlockDto => ({ blockId: b.id, blockedId: b.blockedId, createdAt: b.createdAt });

  function block(ctx: CommandContext, input: z.input<typeof targetSchema>): BlockDto {
    authorize(env, ctx, 'moderation.block:create', 'block');
    const v = parse(targetSchema, input);
    if (v.accountId === ctx.actor.id) throw validationError('ABUSE.SELF_BLOCK', 'an account cannot block itself');
    return runCommand(env.deps, anonymized(ctx), { name: 'moderation.block.create', flag: 'moderation.abuse', request: { by: ctx.actor.id, ...v } }, () => {
      const existing = env.cols.blockIndex.get(indexId(ctx.actor.id, v.accountId));
      if (existing) return { result: toDto(env.cols.blocks.require(existing.blockId)) };
      if (ownBlocks(ctx.actor.id, ctx.actor.tenantId).length >= MAX_BLOCKS_PER_ACCOUNT) {
        throw precondition('ABUSE.BLOCK_LIMIT', 'block list is full', { limit: MAX_BLOCKS_PER_ACCOUNT });
      }
      const rec = env.cols.blocks.put(
        { id: env.deps.ids.next('ublk'), tenantId: ctx.actor.tenantId, blockerId: ctx.actor.id, blockedId: v.accountId, createdAt: env.deps.clock.now() },
        0,
      );
      env.cols.blockIndex.put({ id: indexId(ctx.actor.id, v.accountId), blockId: rec.id }, 0);
      // The payload deliberately omits both account ids: blocks are private to the blocker.
      return { result: toDto(rec), events: [event('moderation.block.created', 'block', rec.id, rec.version, { blockId: rec.id })] };
    });
  }

  function unblock(ctx: CommandContext, input: z.input<typeof targetSchema>): { removed: boolean } {
    authorize(env, ctx, 'moderation.block:remove', 'block');
    const v = parse(targetSchema, input);
    return runCommand<{ removed: boolean }>(env.deps, anonymized(ctx), { name: 'moderation.block.remove', flag: 'moderation.abuse', request: { by: ctx.actor.id, ...v } }, () => {
      const idx = env.cols.blockIndex.get(indexId(ctx.actor.id, v.accountId));
      if (!idx) return { result: { removed: false } };
      const rec = env.cols.blocks.require(idx.blockId);
      env.cols.blocks.delete(rec.id, rec.version);
      env.cols.blockIndex.delete(idx.id, idx.version);
      return { result: { removed: true }, events: [event('moderation.block.removed', 'block', rec.id, rec.version + 1, { blockId: rec.id })] };
    });
  }

  function list(ctx: CommandContext, input: z.input<typeof listSchema>): BlockDto[] {
    authorize(env, ctx, 'moderation.block:read_own', 'block');
    const v = parse(listSchema, input);
    return pageOf(ownBlocks(ctx.actor.id, ctx.actor.tenantId), v.offset, v.limit).map(toDto);
  }

  const operations = [
    operation('moderation.block.create', 'command', 'moderation.abuse', 'Block another account (private)', block),
    operation('moderation.block.remove', 'command', 'moderation.abuse', 'Remove a block', unblock),
    operation('moderation.block.list', 'query', 'moderation.abuse', 'List the accounts the caller blocked', list),
  ];
  return { blocks, block, unblock, list, operations };
}
