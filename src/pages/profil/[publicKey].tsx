import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { type UseMutationResult } from '@tanstack/react-query';
import classNames from 'classnames';
import type { GetServerSideProps, NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ProfileData from '~/components/profile/ProfileData';
import ProfileImage from '~/components/profile/ProfileImage';
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
  const textProfil = isReadOnly ? 'Profil' : 'Profilul tău';

  const { data: userData, isLoading: isUserDataLoading } = api.user.fetchUserWithGuard.useQuery(
    {
      publicKey,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
  const nameMutation = api.user.updateName.useMutation() as UseMutationResult;
  const emailMutation = api.user.updateEmail.useMutation() as UseMutationResult;

  const { data: initialProfileImageData, isLoading: isInitialProfileImageDataLoading } = api.user.initiateProfileImageDownload.useQuery(
    {
      publicKey,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
  const [initialProfileImageDataUrl, setInitialProfileImageDataUrl] = useState<string | null>(null);
  const [isInitialProfileImageDownloading, setIsInitialProfileImageDownloading] = useState(false);
  useEffect(() => {
    if (!initialProfileImageData) {
      return;
    }

    const { signedGetUrl } = initialProfileImageData;
    if (!signedGetUrl) {
      return;
    }

    setIsInitialProfileImageDownloading(true);
    fetch(signedGetUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const dataUrlReader = new FileReader();
        dataUrlReader.onloadend = (event) => {
          const result = event.target?.result;
          if (!result) {
            return;
          }

          setInitialProfileImageDataUrl(result.toString());
        };
        dataUrlReader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsInitialProfileImageDownloading(false);
      });
  }, [initialProfileImageData]);

  const isLoading = isUserDataLoading || isInitialProfileImageDataLoading || isInitialProfileImageDownloading;

  return (
    <>
      <Head>
        <title>Profil &mdash; Parsecfis</title>
      </Head>

      <div className="flex flex-col items-center justify-center">
        <div className="relative z-10 block w-10/12 rounded-xl border border-gray-200 bg-white p-6 shadow sm:w-8/12 md:w-6/12 lg:w-4/12">
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
            <ProfileImage
              initialProfileImageDataUrl={initialProfileImageDataUrl}
              isProfilePageLoading={isLoading}
            />
            {isReadOnly && userData?.name && (
              <ProfileData
                label="Nume"
                value={userData.name}
              />
            )}

            {!isReadOnly && (
              <ProfileInput
                mutation={nameMutation}
                field="name"
                label="Nume"
                placeholder="Ex: Ion Popescu"
                defaultValue={userData?.name ?? ''}
                icon={faUser}
              />
            )}
            {isReadOnly && userData?.email && (
              <ProfileData
                label="Email"
                value={userData.email}
              />
            )}
            {!isReadOnly && (
              <ProfileInput
                mutation={emailMutation}
                field="email"
                label="Email"
                placeholder="Ex: ion.popescu@email.com"
                defaultValue={userData?.email ?? ''}
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
