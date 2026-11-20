import { publicationRepo, validatePublicationRecord } from '../../../packages/bazaar/src/index.ts';
import { verifyEnvelope } from '../../../packages/federation/src/index.ts';
import { backupCodec, type BackupCodec } from '../../../packages/vault/src/index.ts';

/** Publication writers and readers use the signed envelope's CID as the record key. */
export const publicationBackupCodec: BackupCodec = {
  ...backupCodec(publicationRepo),
  recordId(input) {
    return publicationRepo.schema.parse(input).envelope.cid;
  },
  validate: (input: unknown) => validatePublicationRecord(input, verifyEnvelope),
};
