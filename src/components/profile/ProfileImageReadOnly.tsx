import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Image from 'next/image';
import { type FC } from 'react';
import LoadingSpinner from '../shared/LoadingSpinner';

type Props = {
  initialProfileImageDataUrl: string | null;
  isProfilePageLoading: boolean;
};

const ProfileImageReadOnly: FC<Props> = ({ initialProfileImageDataUrl, isProfilePageLoading }) => {
  return (
    <div className="mt-3 flex flex-col items-center justify-center">
      <label
        htmlFor="dropzone-profile-image"
        className={classNames('mx-autoflex relative mb-2 h-48 w-48 flex-col items-center justify-center overflow-hidden rounded-full', {
          'is-loading': isProfilePageLoading,
          'bg-purple-100': !isProfilePageLoading,
        })}
      >
        {isProfilePageLoading && <LoadingSpinner />}
        <div className="relative flex flex-col justify-center text-center">
          {initialProfileImageDataUrl ? (
            <div className="relative h-48 w-48 overflow-hidden rounded-full">
              <Image
                alt="Imagine de profil"
                src={initialProfileImageDataUrl}
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
      </label>
    </div>
  );
};

export default ProfileImageReadOnly;
