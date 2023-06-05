export type FileTablePageRow = {
  publicKey: string;
  fileName: string;
  sharedAt: string;
  deletedAt?: string;
  iv: string;
};

export type FileTablePageMetadata = {
  totalFiles: number;
  totalPages: number;
};

export type FileTablePageData = {
  metadata: FileTablePageMetadata;
  rows: FileTablePageRow[];
};
