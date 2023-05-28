import { useEffect, useRef, useState } from 'react';

type UseDebouncedCallbackArgs<A extends unknown[]> = {
  callback: (...args: A) => void;
  delay: number;
};

type UseDebouncedCallbackResult<A extends unknown[]> = [(...args: A) => void, boolean];

type UseDebouncedCallback = <A extends unknown[]>(args: UseDebouncedCallbackArgs<A>) => UseDebouncedCallbackResult<A>;

export const useDebouncedCallback: UseDebouncedCallback = ({ callback, delay }) => {
  const functionTimeoutHandler = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debouncedFunction = useRef(callback);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    debouncedFunction.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (!functionTimeoutHandler.current) {
        return;
      }
      clearTimeout(functionTimeoutHandler.current);
    },
    [],
  );

  const debouncedCallback: typeof callback = (...args) => {
    setIsLoading(true);
    if (functionTimeoutHandler.current) {
      clearTimeout(functionTimeoutHandler.current);
    }
    functionTimeoutHandler.current = setTimeout(() => {
      debouncedFunction.current(...args);
      setIsLoading(false);
    }, delay);
  };

  return [debouncedCallback, isLoading];
};
