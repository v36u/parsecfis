import { type FileTablePageData } from './@types/FileTablePageData';

export const maxFileSizeInBytes = 512 * 1024 * 1024;
export const maxProfileImageSizeInBytes = 4 * 1024 * 1024;

export const filesPerPage = 10;

export const defaultFileTablePageData: FileTablePageData = { rows: [], metadata: { totalFiles: 0, totalPages: 0 } };

export const eccCurveName = 'secp256k1' as const;
export const eccCurvePublicKeyLength = 130;

export const profileImagePrefix = 'pfp_';

export const defaultAwsFileExpirationSeconds = 120;
export const defaultAwsProfilePictureExpirationSeconds = 5;

export const ivBytes = 16;
