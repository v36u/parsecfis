export type FileTablePageRow = {
  publicKey: string;
  sharedAt: string;
  fileName: string;
  iv: string;
  isDeleted: boolean;
};

export type FileTablePageMetadata = {
  totalFiles: number;
  totalPages: number;
};

export type FileTablePageData = {
  metadata: FileTablePageMetadata;
  rows: FileTablePageRow[];
};
