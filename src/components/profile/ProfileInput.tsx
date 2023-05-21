import { type FC } from 'react';

type Props = {
  label: string;
  field: string;
};

const ProfileInput: FC<Props> = ({ label, field }) => {
  return (
    <>
      <label
        htmlFor={`input-group-${field}`}
        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
          </svg>
        </div>
        <input
          type="text"
          id="input-group-1"
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          placeholder="name@flowbite.com"
        />
      </div>
    </>
  );
};

export default ProfileInput;
