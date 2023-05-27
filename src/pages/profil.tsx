import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import type { GetServerSideProps, NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import ProfileInput, { type ProfileInputMutation } from '~/components/profile/ProfileInput';
import LoadingSpinner from '~/components/shared/LoadingSpinner';
import PublicKeyBadge from '~/components/shared/PublicKeyBadge';
import { nextAuthOptions } from '~/server/auth';
import { api } from '~/utils/api';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

export const ProfilePage: NextPage = () => {
  const { data, isLoading } = api.user.fetchUserWithGuard.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <Head>
        <title>Profil &mdash; Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        <div
          className={classNames(
            'relative z-10 block w-10/12 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 sm:w-8/12 md:w-6/12 lg:w-4/12',
            {
              'is-loading': isLoading,
            },
          )}
        >
          {isLoading && <LoadingSpinner />}
          <h1 className="text-center text-2xl font-bold">Profilul tău</h1>
          <h3 className="text-md mb-6 mt-1.5 text-center font-bold italic text-gray-500">
            Adresă: <PublicKeyBadge publicKey={data?.publicKey ?? ''} />
          </h3>
          <ProfileInput
            mutation={api.user.updateUserName.useMutation() as ProfileInputMutation}
            field="name"
            label="Nume"
            placeholder="Ex: Ion Popescu"
            defaultValue={data?.name ?? ''}
            icon={faUser}
          />
          <ProfileInput
            mutation={api.user.updateUserEmail.useMutation() as ProfileInputMutation}
            field="email"
            label="Email"
            placeholder="Ex: ion.popescu@email.com"
            defaultValue={data?.email ?? ''}
            icon={faEnvelope}
          />
        </div>
      </div>
    </>
  );
};

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
    props: {},
  };
};

export default ProfilePage;
