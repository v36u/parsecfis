import { faCheck, faEllipsisH, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useState, type ChangeEvent, type FC } from 'react';
import { api } from '~/utils/api';
import { useDebouncedCallback } from '~/utils/hooks/useDebouncedCallback';

type Props = {
  field: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  icon: IconDefinition;
};

const ProfileInput: FC<Props> = ({ field, label, defaultValue, icon, placeholder }) => {
  const updateMutation = api.user.updateUserField.useMutation();
  const [debouncedUpdateMutation, isUpdateLoading, isUpdateDone] = useDebouncedCallback({
    callback: updateMutation.mutateAsync,
    delay: 3e3,
  });

  let inputIcon = icon;
  if (isUpdateLoading) {
    inputIcon = faEllipsisH;
  } else if (isUpdateDone) {
    inputIcon = faCheck;
  }

  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    await debouncedUpdateMutation({ fieldName: field, fieldValue: event.target.value });
  };

  return (
    <>
      <label
        htmlFor={`input-group-${field}`}
        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <div className="relative z-10 mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-3">
          <FontAwesomeIcon
            className={classNames({
              'fa-bounce': inputIcon.iconName === faEllipsisH.iconName,
              'fa-beat-fade': inputIcon.iconName === faCheck.iconName,
            })}
            icon={inputIcon}
          />
        </div>
        <input
          type="text"
          value={value}
          id={`input-group-${field}`}
          className="block w-full rounded-lg border-0 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:ring-0 focus:ring-offset-0  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          placeholder={placeholder}
          onChange={handleOnChange}
        />
      </div>
    </>
  );
};

export default ProfileInput;
