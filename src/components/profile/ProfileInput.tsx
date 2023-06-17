import { faCheck, faEllipsisH, faTriangleExclamation, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type UseMutationResult } from '@tanstack/react-query';
import classNames from 'classnames';
import { useEffect, useState, type ChangeEvent, type FC } from 'react';
import { useAppError } from '~/utils/hooks/useAppError';
import { useDebouncedCallback } from '~/utils/hooks/useDebouncedCallback';

type Props = {
  mutation: UseMutationResult;
  field: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  icon: IconDefinition;
};

const ProfileInput: FC<Props> = ({ mutation, field, label, defaultValue, icon, placeholder }) => {
  const { mutate, isError, error, isSuccess, failureCount } = mutation;

  const [debouncedMutation, isLoading] = useDebouncedCallback({
    callback: mutate,
    delay: 2.5e3,
  });

  const { processedError: processedUpdateError } = useAppError({ error });
  const [updateError, setUpdateError] = useState('');
  useEffect(() => {
    if (isError) {
      setUpdateError(processedUpdateError);
    }
  }, [processedUpdateError, failureCount, isError]);

  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUpdateError('');

    const { value: eventValue } = event.target;
    setValue(eventValue);
    debouncedMutation({ [field]: eventValue });
  };

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
        className="mb-2 block text-sm font-medium text-gray-900"
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
          className="block w-full rounded-lg border-0 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:ring-0 focus:ring-offset-0"
          placeholder={placeholder}
          onChange={handleOnChange}
        />
      </div>
      <div className="mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-sm font-bold text-transparent">{updateError}</div>
    </div>
  );
};

export default ProfileInput;
