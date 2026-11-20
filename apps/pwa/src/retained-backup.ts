import { retainedListingId, retainedListingRepo, validateRetainedRecord } from '../../../packages/discovery/src/index.ts';
import { verifyEnvelope } from '../../../packages/federation/src/index.ts';
import { backupCodec, type BackupCodec } from '../../../packages/vault/src/index.ts';

/** Admit retained evidence under the same record key used by normal retention. */
export const retainedBackupCodec: BackupCodec = {
  ...backupCodec(retainedListingRepo),
  recordId(input) {
    const data = retainedListingRepo.schema.parse(input);
    return retainedListingId(data.ownerId, data.listingId);
  },
  validate: (input: unknown) => validateRetainedRecord(input, verifyEnvelope),
};
