import { type GetServerSideProps, type NextPage } from 'next';
import { getServerSession, type Session } from 'next-auth';
import Head from 'next/head';
import AuthenticatedHomeContent from '~/components/home/AuthenticatedHomeContent';
import UnauthenticatedHomeContent from '~/components/home/UnauthenticatedHomeContent';
import { nextAuthOptions } from '~/server/auth';
import { usePageSession } from '~/utils/hooks/usePageSession';

type Props = {
  serverSession: Session | null;
};

const HomePage: NextPage<Props> = ({ serverSession }) => {
  const [pageSession] = usePageSession({ serverSession });

  return (
    <>
      <Head>
        <title>Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        {pageSession ? <AuthenticatedHomeContent session={pageSession} /> : <UnauthenticatedHomeContent />}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  const serverSession = await getServerSession(req, res, nextAuthOptions);

  return {
    props: {
      serverSession,
    },
  };
};

export default HomePage;
