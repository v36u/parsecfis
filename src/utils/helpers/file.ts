import { type FileTablePageRow } from '../@types/FileTablePageData';

export const getFormattedFileSize = (size: number) => {
  if (size === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const rawUnitIndex = Math.floor(Math.log(size) / Math.log(1024));
  const unitIndex = rawUnitIndex >= units.length ? units.length - 1 : rawUnitIndex;
  const unit = units[unitIndex] as string;

  return `${parseFloat((size / 1024 ** unitIndex).toFixed(2))} ${unit}`;
};

export const getFileTablePageRowKey = (row: FileTablePageRow) => {
  return `${row.iv}-${row.sharedAt}-${row.otherParticipantPublicKey}-${row.fileName}`;
};
