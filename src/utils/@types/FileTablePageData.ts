export type FileTablePageRow = {
  otherParticipantPublicKey: string;
  fileName: string;
  sharedAt: string;
  deletedAt?: string;
  iv: string;
  isNew: boolean;
};

export type FileTablePageMetadata = {
  totalFiles: number;
  totalPages: number;
};

export type FileTablePageData = {
  metadata: FileTablePageMetadata;
  rows: FileTablePageRow[];
};
