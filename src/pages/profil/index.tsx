import type { GetServerSideProps, NextPage } from 'next';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '~/server/auth';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

export const ProfileRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/',
        statusCode: HttpStatusCode.TEMPORARY_REDIRECT,
      },
    };
  }

  return {
    redirect: {
      destination: `/profil/${session.user.publicKey}/`,
      statusCode: HttpStatusCode.TEMPORARY_REDIRECT,
    },
  };
};

export default ProfileRedirectPage;
