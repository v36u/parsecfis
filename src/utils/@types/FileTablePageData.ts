export type FileTablePageRow = {
  publicKey: string;
  sharedAt: string;
  fileName: string;
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
