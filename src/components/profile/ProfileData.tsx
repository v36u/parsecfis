import { type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type FC } from 'react';

type Props = {
  label: string;
  value: string;
  icon: IconDefinition;
};

const ProfileData: FC<Props> = ({ label, value, icon }) => {
  return (
    <div className="z-10 mb-6">
      <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      <div className="relative">
        <div className="flefx pointer-events-none absolute inset-y-0 left-0 z-20 items-center pl-3">
          <FontAwesomeIcon icon={icon} />
          <span className="block w-full rounded-lg border-0 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:ring-0 focus:ring-offset-0  dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileData;
