import { faCircleArrowUp, faTrashCan, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { type Session } from 'next-auth';
import Image from 'next/image';
import { useCallback, useEffect, useState, type ChangeEvent, type Dispatch, type FC, type SetStateAction } from 'react';
import { api } from '~/utils/api';
import { maxProfileImageSizeInBytes } from '~/utils/constants';
import { getFormattedFileSize } from '~/utils/helpers/file';
import { useAppError } from '~/utils/hooks/useAppError';
import LoadingSpinner from '../shared/LoadingSpinner';

type Props = {
  initialProfileImageDataUrl: string | null;
  initialProfileImageFile: File | null;
  isProfilePageLoading: boolean;
  isPrivate: boolean | null;
  pageSession: Session;
  isInitialProfileImageDownloading: boolean;
  setIsInitialProfileImageDownloading: Dispatch<SetStateAction<boolean>>;
};

const ProfileImage: FC<Props> = ({
  initialProfileImageDataUrl,
  initialProfileImageFile,
  isProfilePageLoading,
  isPrivate,
  pageSession,
  isInitialProfileImageDownloading,
  setIsInitialProfileImageDownloading,
}) => {
  const {
    mutate: uploadProfileImage,
    data: uploadProfileImageData,
    isLoading: isUploadProfileImageLoading,
    error: uploadProfileImageError,
    isError: isUploadProfileImageError,
    isSuccess: isUploadProfileImageSuccess,
    reset: resetUploadProfileImage,
  } = api.user.uploadProfileImage.useMutation();
  const {
    mutate: deleteProfileImage,
    isLoading: isDeleteProfileImageLoading,
    error: deleteProfileImageError,
    isError: isDeleteProfileImageError,
    isSuccess: isDeleteProfileImageSuccess,
    reset: resetDeleteProfileImage,
  } = api.user.deleteProfileImage.useMutation();

  const { processedError: processedUploadProfileImageError } = useAppError({ error: uploadProfileImageError });
  const { processedError: processedDeleteProfileImageError } = useAppError({ error: deleteProfileImageError });

  const [profileImageDataUrl, setProfileImageDataUrl] = useState<string | null>(initialProfileImageDataUrl);
  useEffect(() => {
    setProfileImageDataUrl(initialProfileImageDataUrl);
  }, [initialProfileImageDataUrl]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(initialProfileImageFile);
  useEffect(() => {
    setProfileImageFile(initialProfileImageFile);
    setIsInitialProfileImageDownloading(false);
  }, [initialProfileImageFile, setIsInitialProfileImageDownloading]);

  const [isHovering, setIsHovering] = useState(false);
  const [ignoreMouseEvents, setIgnoreMouseEvents] = useState(false);

  const handleMouseEnter = () => {
    if (!ignoreMouseEvents) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!ignoreMouseEvents) {
      setIsHovering(false);
    }
  };

  const handleTouchStart = () => {
    setIsHovering(true);
    setIgnoreMouseEvents(true);
  };

  const handleTouchEnd = () => {
    setIsHovering(false);
    setTimeout(() => {
      setIgnoreMouseEvents(false);
    }, 1500);
  };

  const [error, setError] = useState('');
  useEffect(() => {
    let errorTimeout: ReturnType<typeof setTimeout> | null = null;

    if (error.length === 0) {
      return () => {
        if (errorTimeout) {
          clearTimeout(errorTimeout);
        }
      };
    }
    errorTimeout = setTimeout(() => {
      setError('');
    }, 5000);

    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [error.length]);

  const [isUploadLoading, setIsUploadLoading] = useState(false);

  const [profileImageInputValue, setProfileImageInputValue] = useState('');

  const [isProfileImagePrivate, setIsProfileImagePrivate] = useState(!!isPrivate);
  useEffect(() => {
    if (typeof isPrivate !== 'object') {
      setIsProfileImagePrivate(isPrivate);
    }
  }, [isPrivate]);

  const [isReuploadLoading, setIsReuploadLoading] = useState(false);
  const getHandlePrivateProfileImageCheckboxChange = useCallback(
    () => (event: ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      setIsProfileImagePrivate(checked);
      if (!profileImageFile) {
        return;
      }

      deleteProfileImage();
      setIsReuploadLoading(true);
    },
    [deleteProfileImage, profileImageFile],
  );
  useEffect(() => {
    if (!isReuploadLoading) {
      return;
    }
    if (!isDeleteProfileImageSuccess) {
      return;
    }
    if (!profileImageFile) {
      return;
    }

    uploadProfileImage({
      fileType: profileImageFile.type,
      isPrivate: isProfileImagePrivate,
    });
  }, [isDeleteProfileImageSuccess, isProfileImagePrivate, profileImageFile, isReuploadLoading, uploadProfileImage]);

  const clearProfileImage = useCallback(() => {
    setProfileImageFile(null);
    setProfileImageDataUrl(null);
    setProfileImageInputValue('');
  }, []);

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setProfileImageInputValue(event.target.value);

    const { files } = event.target;
    if (!files || files.length < 0) {
      return;
    }

    const file = files[0];
    if (!file) {
      return;
    }
    setProfileImageFile(file);

    if (file.size > maxProfileImageSizeInBytes) {
      setError(`Imaginea selectată nu a fost încărcată deoarece depășește limita de ${getFormattedFileSize(maxProfileImageSizeInBytes)}.`);
      return;
    }

    const dataUrlReader = new FileReader();
    dataUrlReader.onloadend = (event) => {
      const result = event.target?.result;
      if (!result) {
        return;
      }

      setProfileImageDataUrl(result.toString());
    };
    dataUrlReader.readAsDataURL(file);

    uploadProfileImage({
      fileType: file.type,
      isPrivate: isProfileImagePrivate,
    });
  };

  useEffect(() => {
    if (isUploadProfileImageError) {
      setError(processedUploadProfileImageError);
      return;
    }

    if (!isUploadProfileImageSuccess) {
      return;
    }

    if (!uploadProfileImageData || !profileImageFile) {
      setError('A intervenit o eroare. Te rugăm să reîncerci.');
      return;
    }

    const { presignedPost } = uploadProfileImageData;

    const reader = new FileReader();
    reader.onloadend = (event) => {
      const result = event.target?.result;
      if (!result) {
        setError('A intervenit o eroare. Te rugăm să reîncerci.');
        return;
      }

      const encryptionWorker = new Worker(new URL('../../utils/workers/fileEncryptionWebWorker', import.meta.url));

      encryptionWorker.onmessage = (event) => {
        const formData = new FormData();
        Object.entries({ ...presignedPost.fields, file: event.data as File }).forEach(([key, value]) => {
          formData.append(key, value);
        });

        setIsUploadLoading(true);
        fetch(presignedPost.url, {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            if (!response.ok) {
              setError('A intervenit o eroare. Te rugăm să reîncerci.');
              console.error(await response.text());
            }
          })
          .catch(() => {
            setError('A intervenit o eroare. Te rugăm să reîncerci.');
          })
          .finally(() => {
            setIsReuploadLoading(false);
            setIsUploadLoading(false);
            resetUploadProfileImage();
          });
      };
      encryptionWorker.onerror = () => {
        setError('A intervenit o eroare. Te rugăm să reîncerci.');
      };
      encryptionWorker.postMessage({
        value: isProfileImagePrivate ? result : profileImageFile,
        encryptionKey: pageSession.user.privateKey,
        fileType: profileImageFile.type,
        skip: !isProfileImagePrivate,
      });
    };
    reader.readAsArrayBuffer(profileImageFile);
  }, [
    isProfileImagePrivate,
    isUploadProfileImageError,
    isUploadProfileImageSuccess,
    pageSession.user.privateKey,
    processedUploadProfileImageError,
    profileImageFile,
    resetUploadProfileImage,
    uploadProfileImageData,
  ]);

  const handleDeleteProfileImage = () => {
    setIsProfileImagePrivate(false);

    if (error.length > 0) {
      setError('');
      return;
    }

    setError('');
    deleteProfileImage();
    clearProfileImage();
  };

  useEffect(() => {
    if (isDeleteProfileImageError) {
      setError(processedDeleteProfileImageError);
      return;
    }
    if (!isDeleteProfileImageSuccess) {
      return;
    }
    resetDeleteProfileImage();
  }, [clearProfileImage, isDeleteProfileImageError, isDeleteProfileImageSuccess, processedDeleteProfileImageError, resetDeleteProfileImage]);

  const isLoading =
    !isProfilePageLoading &&
    (isUploadProfileImageLoading || isUploadLoading || isDeleteProfileImageLoading || isInitialProfileImageDownloading || isReuploadLoading);

  return (
    <div className=" mt-3 flex flex-col items-center justify-center">
      <label
        htmlFor="dropzone-profile-image"
        className={classNames('mx-autoflex relative mb-2 h-48 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full', {
          'is-loading border-2 border-dashed border-purple-200': isLoading,
          'border-2 border-dashed border-purple-600 bg-purple-100': !isLoading,
        })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && <LoadingSpinner />}
        <div
          className={classNames('relative flex flex-col justify-center text-center', {
            'opacity-50': isHovering,
          })}
        >
          {profileImageDataUrl ? (
            <div className="relative h-48 w-48 overflow-hidden rounded-full">
              <Image
                alt="Imagine de profil"
                src={profileImageDataUrl}
                fill
                className="absolute h-full w-full object-cover object-center"
              />
            </div>
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className="h-48 w-48 text-purple-300"
            />
          )}
        </div>
        {isHovering && (
          <FontAwesomeIcon
            icon={faCircleArrowUp}
            className="absolute left-1/2 top-1/2 z-50 h-48 w-48 -translate-x-1/2 -translate-y-1/2 transform text-purple-800 opacity-50"
          />
        )}
        <input
          id="dropzone-profile-image"
          type="file"
          className="hidden"
          accept="image/*"
          multiple={false}
          value={profileImageInputValue}
          onChange={handleProfileImageChange}
        />
      </label>
      {profileImageDataUrl && (
        <div className="flex gap-5">
          <div className="flex items-center justify-center">
            <input
              id="private-profile-image"
              type="checkbox"
              onChange={getHandlePrivateProfileImageCheckboxChange()}
              checked={isProfileImagePrivate}
              className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <label
              htmlFor="private-profile-image"
              className="ml-2 cursor-pointer text-sm font-medium text-gray-900"
            >
              Imagine
              <br />
              privată
            </label>
          </div>
          <button
            type="button"
            className="flex items-center justify-center text-red-500"
            value={profileImageInputValue}
            onClick={handleDeleteProfileImage}
          >
            <FontAwesomeIcon icon={faTrashCan} />{' '}
            <span className="ml-2">
              Ștergere
              <br />
              imagine
            </span>
          </button>
        </div>
      )}
      <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-center text-sm font-bold text-transparent">{error}</div>
    </div>
  );
};

export default ProfileImage;
