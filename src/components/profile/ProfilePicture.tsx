//src/components/profile/ProfilePicture.tsx

import { faCircleArrowUp, faTrashCan, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Image from 'next/image';
import { useState, type ChangeEvent, type FC } from 'react';
import { maxProfilePictureSizeInBytes } from '~/utils/constants';
import { getFormattedFileSize } from '~/utils/helpers/file';

const ProfilePicture: FC = () => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState('');

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');

    const { files } = event.target;
    if (!files || files.length < 0) {
      return;
    }

    const file = files[0];
    if (!file) {
      return;
    }

    if (file.size > maxProfilePictureSizeInBytes) {
      setError(`Poza selectată nu a fost încărcată deoarece depășește limita de ${getFormattedFileSize(maxProfilePictureSizeInBytes)}.`);
    }

    const reader = new FileReader();
    reader.onloadend = (event) => {
      const result = event.target?.result;
      if (!result) {
        return;
      }

      setProfilePicture(result.toString());
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProfilePicture = () => {
    setError('');
    setProfilePicture(null);
  };

  return (
    <div className="my-6 flex flex-col items-center justify-center">
      <label
        htmlFor="dropzone-profile-picture"
        className="mx-autoflex relative mb-2 h-48 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-purple-600 bg-purple-100"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className={classNames('relative flex flex-col justify-center text-center', {
            'opacity-50': isHovering,
          })}
        >
          {profilePicture ? (
            <div className="relative h-48 w-48 overflow-hidden rounded-full">
              <Image
                alt="Poză de profil"
                src={profilePicture}
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
          id="dropzone-profile-picture"
          type="file"
          className="hidden"
          accept="image/*"
          multiple={false}
          onChange={handleProfilePictureChange}
        />
      </label>
      {profilePicture && (
        <button
          type="button"
          className="text-red-500"
          onClick={handleDeleteProfilePicture}
        >
          <FontAwesomeIcon icon={faTrashCan} /> Șterge poza
        </button>
      )}
      <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-center text-sm font-bold text-transparent">{error}</div>
    </div>
  );
};

export default ProfilePicture;
