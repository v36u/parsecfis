import { useEffect, useState } from 'react';

type WithMessage = {
  message: string;
};

type UseAppErrorArgs = {
  error: unknown;
};

type UseAppErrorResult = {
  processedError: string;
};

type UseAppError = (args: UseAppErrorArgs) => UseAppErrorResult;

export const useAppError: UseAppError = ({ error }) => {
  const [processedError, setProcessedError] = useState('');

  useEffect(() => {
    if (!error) {
      return;
    }

    const { message: errorMessage } = error as WithMessage;

    try {
      const deserializedErrors = JSON.parse(errorMessage) as Array<Record<string, unknown>>;
      const deserializedErrorMessage = (deserializedErrors[0] as WithMessage).message;
      setProcessedError(deserializedErrorMessage);
    } catch (_) {
      setProcessedError(errorMessage);
    }
  }, [error]);

  return {
    processedError,
  };
};
