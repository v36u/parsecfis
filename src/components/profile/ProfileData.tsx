import { type FC } from 'react';

type Props = {
  label: string;
  value: string;
};

const ProfileData: FC<Props> = ({ label, value }) => {
  return (
    <div className="z-10 mb-6">
      <span className="mb-2 block text-sm font-medium text-gray-900">{label}:</span>
      {value}
    </div>
  );
};

export default ProfileData;
