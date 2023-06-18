import { type FC } from 'react';

type Props = {
  label: string;
  value: string;
};

const ProfileInputReadOnly: FC<Props> = ({ label, value }) => {
  return (
    <div className="z-10 text-center">
      <span className="block text-sm font-medium text-gray-900">{label}:</span>
      {value}
    </div>
  );
};

export default ProfileInputReadOnly;
