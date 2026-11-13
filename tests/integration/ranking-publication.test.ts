import { expect, it } from 'vitest';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';
import { unwrap } from '../../packages/kernel/src/errors/result.ts';
import { createIdentity } from '../../packages/identity/src/identity.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import {
  DEFAULT_RANKING_PARAMS, rankingConfigDefinitions, readRankingConfigStatement,
  type RankingConfigOptions,
} from '../../packages/discovery/src/ranking/relevance/index.ts';

it('publishes the first relay ranking config and chains a rollback using the federation signer', async () => {
  const k = createTestKernel();
  const { identity } = await createIdentity('ranking publication test passphrase');
  const operator = k.user(['operator']);
  const options: RankingConfigOptions = {
    relayId: 'relay-a', relayAuthor: identity.principal,
    isOperator: id => operator.kind === 'user' && id === operator.id,
    signStatement: async (type, payload, seq, prev) => ({
      ...await signEnvelope(identity, { type, payload, seq, prev, createdAt: k.clock.iso() }),
    }),
    verifyStatement: envelope => verifyEnvelope(envelope, { now: k.clock.now() }),
  };
  const defs = rankingConfigDefinitions(options);
  k.registry.add(...defs.all);
  async function readActive() {
    const { value } = unwrap(await k.ask(defs.getActive.name, {}));
    const { statement } = value as { statement: unknown };
    const verified = await verifyEnvelope(statement, { expectedAuthor: identity.principal, now: k.clock.now() });
    const config = unwrap(await readRankingConfigStatement(statement, options.verifyStatement, { relayAuthor: identity.principal }));
    return { verified, config };
  }

  unwrap(await k.cmd(defs.publish.name, { ...DEFAULT_RANKING_PARAMS, recencyHalfLifeDays: 45, expectedActiveVersion: 1 }, { actor: operator }));
  const first = await readActive();
  expect(first.verified).toMatchObject({ seq: 1, prev: null });
  expect(first.config).toMatchObject({ version: 2, recencyHalfLifeDays: 45 });
  const { identity: otherRelay } = await createIdentity('another ranking relay passphrase');
  const wrongRelay = await readRankingConfigStatement(first.verified, options.verifyStatement, { relayAuthor: otherRelay.principal });
  expect(wrongRelay).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });

  unwrap(await k.cmd(defs.rollback.name, { targetVersion: 1, expectedActiveVersion: 2 }, { actor: operator }));
  const rollback = await readActive();
  expect(rollback.verified).toMatchObject({ seq: 2, prev: first.verified.cid });
  expect(rollback.config).toMatchObject({ version: 3, recencyHalfLifeDays: 14 });
});
