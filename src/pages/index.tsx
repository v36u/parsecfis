import { type NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import AuthenticatedContent from '~/components/home/AuthenticatedContent';
import UnauthenticatedContent from '~/components/home/UnauthenticatedContent';

const HomePage: NextPage = () => {
  const session = useSession();

  return (
    <>
      <Head>
        <title>Acasă &mdash; Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        {session.status === 'unauthenticated' && <UnauthenticatedContent />}
        {session.status === 'authenticated' && <AuthenticatedContent />}
      </div>
    </>
  );
};

export default HomePage;
