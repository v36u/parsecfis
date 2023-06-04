import { type NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AuthenticatedHomeContent from '~/components/home/AuthenticatedHomeContent';
import UnauthenticatedHomeContent from '~/components/home/UnauthenticatedHomeContent';

const HomePage: NextPage = () => {
  // TODO: Move this to SSR to potentially speed up the load
  const session = useSession();

  return (
    <>
      <Head>
        <title>Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        {session.status === 'unauthenticated' && <UnauthenticatedHomeContent />}
        {session.status === 'authenticated' && <AuthenticatedHomeContent />}
      </div>
    </>
  );
};

export default HomePage;
