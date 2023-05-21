import { useSession } from 'next-auth/react';
import { type FC } from 'react';
import invariant from 'tiny-invariant';

export const ShortenedPublicKey: FC = () => {
  const session = useSession();
  const publicKey = session.data?.user.publicKey;

  invariant(publicKey, 'Cheia publică din sesiune nu este definită.');

  return <></>;
};

export default ShortenedPublicKey;
