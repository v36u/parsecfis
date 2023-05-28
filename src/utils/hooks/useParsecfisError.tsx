import { useEffect, useState } from 'react';

type WithMessage = {
  message: string;
};

type UseParsecfisErrorArgs = {
  error: unknown;
};

type UseParsecfisErrorResult = {
  processedError: string;
};

type UseParsecfisError = (args: UseParsecfisErrorArgs) => UseParsecfisErrorResult;

export const useParsecfisError: UseParsecfisError = ({ error }) => {
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
