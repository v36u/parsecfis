import { type Session } from 'next-auth';
import invariant from 'tiny-invariant';

export const getUserKeysWithGuard = (session: Session | null) => {
  const publicKey = session?.user.publicKey;
  const privateKey = session?.user.privateKey;
  invariant(publicKey && privateKey, 'Perechea de chei nu există în sesiune');

  return { publicKey, privateKey };
};
