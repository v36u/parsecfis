import { faCheck, faEllipsisH, faTriangleExclamation, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type UseMutationResult } from '@tanstack/react-query';
import classNames from 'classnames';
import { useEffect, useState, type ChangeEvent, type FC } from 'react';
import { useDebouncedCallback } from '~/utils/hooks/useDebouncedCallback';

export type ProfileInputMutation = UseMutationResult;

type WithMessage = {
  message: string;
};

type Props = {
  mutation: ProfileInputMutation;
  field: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  icon: IconDefinition;
};

const ProfileInput: FC<Props> = ({ mutation, field, label, defaultValue, icon, placeholder }) => {
  const { mutate, isError, error, isSuccess } = mutation;
  const [debouncedMutation, isLoading] = useDebouncedCallback({
    callback: mutate,
    delay: 2.5e3,
  });

  const [value, setValue] = useState(defaultValue);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUpdateError('');

    const { value: eventValue } = event.target;
    setValue(eventValue);
    debouncedMutation({ [field]: eventValue });
  };

  useEffect(() => {
    if (!error) {
      return;
    }

    const { message: errorMessage } = error as WithMessage;

    try {
      const deserializedErrors = JSON.parse(errorMessage) as Array<Record<string, unknown>>;
      const deserializedErrorMessage = (deserializedErrors[0] as WithMessage).message;
      setUpdateError(deserializedErrorMessage);
    } catch (_) {
      setUpdateError(errorMessage);
    }
  }, [error]);

  const [inputIcon, setInputIcon] = useState(icon);
  useEffect(() => {
    if (isLoading) {
      setInputIcon(faEllipsisH);
      return;
    }

    if (isError) {
      setInputIcon(faTriangleExclamation);
    } else if (isSuccess) {
      setInputIcon(faCheck);
    }

    const effectTimeout = setTimeout(() => {
      setInputIcon(icon);
    }, 1e3);

    return () => {
      clearTimeout(effectTimeout);
    };
  }, [icon, isError, isLoading, isSuccess]);

  return (
    <div className="z-10 mb-6">
      <label
        htmlFor={`input-group-${field}`}
        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-3">
          <FontAwesomeIcon
            className={classNames({
              'fa-bounce': inputIcon.iconName === faEllipsisH.iconName,
              'fa-beat-fade': inputIcon.iconName === faCheck.iconName || inputIcon.iconName === faTriangleExclamation.iconName,
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
      <div className="mt-1 bg-gradient-to-br from-red-600 to-red-500 bg-clip-text text-sm font-bold text-transparent">{updateError}</div>
    </div>
  );
};

export default ProfileInput;
