import { type GetServerSideProps, type NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import AuthenticatedHomeContent from '~/components/home/AuthenticatedHomeContent';
import UnauthenticatedHomeContent from '~/components/home/UnauthenticatedHomeContent';
import { nextAuthOptions } from '~/server/auth';

type Props = {
  isAuthenticated: boolean;
};

const HomePage: NextPage<Props> = ({ isAuthenticated }) => {
  return (
    <>
      <Head>
        <title>Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">{isAuthenticated ? <AuthenticatedHomeContent /> : <UnauthenticatedHomeContent />}</div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  const session = await getServerSession(req, res, nextAuthOptions);

  return {
    props: {
      isAuthenticated: !!session?.user,
    },
  };
};

export default HomePage;
