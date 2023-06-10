import { type DeletionReason } from '@prisma/client';

export type FileTablePageRow = {
  otherParticipantPublicKey: string;
  fileName: string;
  sharedAt: string;
  iv: string;
  isNew?: boolean;
  deletedAt?: string;
  deletionReason?: DeletionReason;
};

export type FileTablePageMetadata = {
  totalFiles: number;
  totalPages: number;
};

export type FileTablePageData = {
  metadata: FileTablePageMetadata;
  rows: FileTablePageRow[];
};
