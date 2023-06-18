import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { type UseMutationResult } from '@tanstack/react-query';
import classNames from 'classnames';
import type { GetServerSideProps, NextPage } from 'next';
import { getServerSession, type Session } from 'next-auth';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ProfileImage from '~/components/profile/ProfileImage';
import ProfileImageReadOnly from '~/components/profile/ProfileImageReadOnly';
import ProfileInput from '~/components/profile/ProfileInput';
import ProfileInputReadOnly from '~/components/profile/ProfileInputReadOnly';
import LoadingSpinner from '~/components/shared/LoadingSpinner';
import PublicKeyBadge from '~/components/shared/PublicKeyBadge';
import { nextAuthOptions } from '~/server/auth';
import { api } from '~/utils/api';
import { usePageSession } from '~/utils/hooks/usePageSession';

type Props = {
  serverSession: Session | null;
  publicKey: string;
  isReadOnly: boolean;
};

export const ProfilePage: NextPage<Props> = ({ publicKey, isReadOnly, serverSession }) => {
  const [pageSession] = usePageSession({ serverSession });
  const privateKey = pageSession?.user.privateKey;

  const textProfil = isReadOnly ? 'Profil' : 'Profilul tău';

  const { data: userData, isFetching: isUserDataLoading } = api.user.fetchUser.useQuery(
    {
      publicKey,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: 0,
    },
  );
  const nameMutation = api.user.updateName.useMutation() as UseMutationResult;
  const emailMutation = api.user.updateEmail.useMutation() as UseMutationResult;

  const { data: initialProfileImageData, isFetching: isInitialProfileImageDataLoading } = api.user.initiateProfileImageDownload.useQuery(
    {
      publicKey,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: 0,
    },
  );
  const [initialProfileImageDataUrl, setInitialProfileImageDataUrl] = useState<string | null>(null);
  const [initialProfileImageFile, setInitialProfileImageFile] = useState<File | null>(null);
  const [isInitialProfileImageDownloading, setIsInitialProfileImageDownloading] = useState(false);

  useEffect(() => {
    if (!initialProfileImageData || isInitialProfileImageDataLoading) {
      return;
    }

    const { signedGetUrl, isPrivate } = initialProfileImageData;
    if (!signedGetUrl) {
      setInitialProfileImageDataUrl(null);
      return;
    }

    setIsInitialProfileImageDownloading(true);
    fetch(signedGetUrl)
      .then((response) => response.blob())
      .then((blob) => {
        if (!isPrivate) {
          setInitialProfileImageFile(
            new File([blob], publicKey, {
              type: blob.type,
              lastModified: Date.now(),
            }),
          );

          const dataUrlReader = new FileReader();
          dataUrlReader.onloadend = (event) => {
            const result = event.target?.result;
            if (!result) {
              return;
            }

            setInitialProfileImageDataUrl(result.toString());
          };
          dataUrlReader.readAsDataURL(blob);
          return;
        }

        if (!privateKey) {
          return;
        }

        const arrayBufferReader = new FileReader();
        arrayBufferReader.onloadend = (event) => {
          const result = event.target?.result;
          if (!result) {
            return;
          }

          const decryptionWorker = new Worker(new URL('../../utils/workers/fileDecryptionWebWorker', import.meta.url));

          decryptionWorker.onmessage = (event) => {
            const decryptedBlob = event.data as Blob;
            setInitialProfileImageFile(
              new File([decryptedBlob], publicKey, {
                type: blob.type,
                lastModified: Date.now(),
              }),
            );

            const dataUrlReader = new FileReader();
            dataUrlReader.onloadend = (event) => {
              const result = event.target?.result;
              if (!result) {
                return;
              }

              setInitialProfileImageDataUrl(result.toString());
            };
            dataUrlReader.readAsDataURL(decryptedBlob);
          };
          decryptionWorker.postMessage({
            value: result,
            decryptionKey: privateKey,
            fileType: blob.type,
          });
        };
        arrayBufferReader.readAsArrayBuffer(blob);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [initialProfileImageData, isInitialProfileImageDataLoading, privateKey, publicKey]);

  const isLoading = isUserDataLoading || isInitialProfileImageDataLoading;

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
            {isReadOnly || !pageSession ? (
              <ProfileImageReadOnly
                initialProfileImageDataUrl={initialProfileImageDataUrl}
                isProfilePageLoading={isLoading}
              />
            ) : (
              <ProfileImage
                initialProfileImageDataUrl={initialProfileImageDataUrl}
                initialProfileImageFile={initialProfileImageFile}
                isPrivate={initialProfileImageData?.isPrivate ?? null}
                isProfilePageLoading={isLoading}
                pageSession={pageSession}
                isInitialProfileImageDownloading={isInitialProfileImageDownloading}
                setIsInitialProfileImageDownloading={setIsInitialProfileImageDownloading}
              />
            )}
            {isReadOnly && (
              <div className="mt-1 flex items-center justify-center gap-10">
                {userData?.name && (
                  <ProfileInputReadOnly
                    label="Nume"
                    value={userData.name}
                  />
                )}
                {userData?.email && (
                  <ProfileInputReadOnly
                    label="Email"
                    value={userData.email}
                  />
                )}
              </div>
            )}
            {!isReadOnly && (
              <>
                <ProfileInput
                  mutation={nameMutation}
                  field="name"
                  label="Nume"
                  placeholder="Ex: Ion Popescu"
                  defaultValue={userData?.name ?? ''}
                  icon={faUser}
                />
                <ProfileInput
                  mutation={emailMutation}
                  field="email"
                  label="Email"
                  placeholder="Ex: ion.popescu@email.com"
                  defaultValue={userData?.email ?? ''}
                  icon={faEnvelope}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
  const serverSession = await getServerSession(req, res, nextAuthOptions);

  const publicKey = params?.publicKey;
  if (typeof publicKey !== 'string') {
    return {
      notFound: true,
    };
  }

  const isReadOnly = serverSession?.user.publicKey !== publicKey;

  return {
    props: {
      serverSession,
      publicKey,
      isReadOnly,
    },
  };
};

export default ProfilePage;
