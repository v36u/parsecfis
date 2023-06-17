import { profileImagePrefix } from '../constants';

export const getProfileImageS3Key = (publicKey: string) => `${profileImagePrefix}${publicKey}`;
