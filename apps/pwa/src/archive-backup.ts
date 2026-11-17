import { archiveRecordRepo } from '../../../packages/bazaar/src/index.ts';
import { backupCodec, type BackupCodec } from '../../../packages/vault/src/index.ts';

/** Restore only structurally valid archive evidence belonging to this backup's identity. */
export const archiveBackupCodec: BackupCodec = {
  ...backupCodec(archiveRecordRepo),
  async restoreData(input, principal) {
    const data = archiveRecordRepo.schema.parse(input);
    if (data.ownerId !== principal) throw new Error('Backup archive belongs to another principal');
    return data;
  },
};
