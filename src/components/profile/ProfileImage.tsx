import { faCircleArrowUp, faTrashCan, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Image from 'next/image';
import { useCallback, useEffect, useState, type ChangeEvent, type FC } from 'react';
import { api } from '~/utils/api';
import { maxProfileImageSizeInBytes } from '~/utils/constants';
import { getFormattedFileSize } from '~/utils/helpers/file';
import { useAppError } from '~/utils/hooks/useAppError';
import LoadingSpinner from '../shared/LoadingSpinner';

type Props = {
  initialProfileImageDataUrl: string | null;
  isProfilePageLoading: boolean;
};

const ProfileImage: FC<Props> = ({ initialProfileImageDataUrl, isProfilePageLoading }) => {
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

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState('');

  const [isUploadLoading, setIsUploadLoading] = useState(false);

  const [profileImageInputValue, setProfileImageInputValue] = useState('');

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

    const dataUrlReader = new FileReader();
    dataUrlReader.onloadend = (event) => {
      const result = event.target?.result;
      if (!result) {
        return;
      }

      setProfileImageDataUrl(result.toString());
    };
    dataUrlReader.readAsDataURL(file);

    if (file.size > maxProfileImageSizeInBytes) {
      setError(`Imaginea selectată nu a fost încărcată deoarece depășește limita de ${getFormattedFileSize(maxProfileImageSizeInBytes)}.`);
      return;
    }
    uploadProfileImage({
      fileType: file.type,
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

    setIsUploadLoading(true);

    const { presignedPost } = uploadProfileImageData;

    const formData = new FormData();
    Object.entries({ ...presignedPost.fields, file: profileImageFile }).forEach(([key, value]) => {
      formData.append(key, value);
    });

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
        setIsUploadLoading(false);
        resetUploadProfileImage();
      });
  }, [
    isUploadProfileImageError,
    isUploadProfileImageSuccess,
    processedUploadProfileImageError,
    profileImageFile,
    resetUploadProfileImage,
    uploadProfileImageData,
  ]);

  const handleDeleteProfileImage = () => {
    if (error.length > 0) {
      clearProfileImage();
      setError('');
      return;
    }

    setError('');
    deleteProfileImage();
  };

  useEffect(() => {
    if (isDeleteProfileImageError) {
      setError(processedDeleteProfileImageError);
      return;
    }
    if (!isDeleteProfileImageSuccess) {
      return;
    }
    clearProfileImage();
    resetDeleteProfileImage();
  }, [clearProfileImage, isDeleteProfileImageError, isDeleteProfileImageSuccess, processedDeleteProfileImageError, resetDeleteProfileImage]);

  const isLoading = !isProfilePageLoading && (isUploadProfileImageLoading || isUploadLoading || isDeleteProfileImageLoading);

  return (
    <div className="mb-3 mt-6 flex flex-col items-center justify-center">
      <label
        htmlFor="dropzone-profile-image"
        className={classNames('mx-autoflex relative mb-2 h-48 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full', {
          'is-loading border-2 border-dashed border-purple-200': isLoading,
          'border-2 border-dashed border-purple-600 bg-purple-100': !isLoading,
        })}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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
        <button
          type="button"
          className="text-red-500"
          value={profileImageInputValue}
          onClick={handleDeleteProfileImage}
        >
          <FontAwesomeIcon icon={faTrashCan} /> Șterge imaginea
        </button>
      )}
      <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-center text-sm font-bold text-transparent">{error}</div>
    </div>
  );
};

export default ProfileImage;
