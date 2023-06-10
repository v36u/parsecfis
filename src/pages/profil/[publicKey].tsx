import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { type UseMutationResult } from '@tanstack/react-query';
import classNames from 'classnames';
import type { GetServerSideProps, NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import ProfileData from '~/components/profile/ProfileData';
import ProfileInput from '~/components/profile/ProfileInput';
import LoadingSpinner from '~/components/shared/LoadingSpinner';
import PublicKeyBadge from '~/components/shared/PublicKeyBadge';
import { nextAuthOptions } from '~/server/auth';
import { api } from '~/utils/api';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

type Props = {
  publicKey: string;
  isReadOnly: boolean;
};

export const ProfilePage: NextPage<Props> = ({ publicKey, isReadOnly }) => {
  const { data, isLoading } = api.user.fetchUserWithGuard.useQuery(
    {
      publicKey,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  const nameMutation = api.user.updateUserName.useMutation() as UseMutationResult;
  const emailMutation = api.user.updateUserEmail.useMutation() as UseMutationResult;

  const textProfil = isReadOnly ? 'Profil' : 'Profilul tău';

  return (
    <>
      <Head>
        <title>{textProfil} &mdash; Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        <div className="relative z-10 block w-10/12 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 sm:w-8/12 md:w-6/12 lg:w-4/12">
          <h1 className="text-center text-2xl font-bold">{textProfil}</h1>
          <h4 className="text-md mt-1.5 text-center font-bold text-gray-500">
            <span>Adresă: </span>
            <PublicKeyBadge
              publicKey={publicKey}
              displayCopyButton
            />
          </h4>
          <div
            className={classNames({
              'is-loading': isLoading,
            })}
          >
            {isLoading && <LoadingSpinner />}
            {isReadOnly && data?.name && (
              <ProfileData
                label="Nume"
                value={data.name}
              />
            )}

            {!isReadOnly && (
              <ProfileInput
                mutation={nameMutation}
                field="name"
                label="Nume"
                placeholder="Ex: Ion Popescu"
                defaultValue={data?.name ?? ''}
                icon={faUser}
              />
            )}
            {isReadOnly && data?.email && (
              <ProfileData
                label="Email"
                value={data.email}
              />
            )}
            {!isReadOnly && (
              <ProfileInput
                mutation={emailMutation}
                field="email"
                label="Email"
                placeholder="Ex: ion.popescu@email.com"
                defaultValue={data?.email ?? ''}
                icon={faEnvelope}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/',
        statusCode: HttpStatusCode.TEMPORARY_REDIRECT,
      },
    };
  }

  const publicKey = params?.publicKey;
  if (typeof publicKey !== 'string') {
    return {
      notFound: true,
    };
  }

  const isReadOnly = session.user.publicKey !== publicKey;

  return {
    props: {
      publicKey,
      isReadOnly,
    },
  };
};

export default ProfilePage;
