import { useEffect, useRef, useState } from 'react';

type UseDebouncedCallbackArgs<A extends unknown[], R> = {
  callback: (...args: A) => Promise<R>;
  delay: number;
};

type UseDebouncedCallbackResult<A extends unknown[], R> = [(...args: A) => Promise<R>, boolean, boolean];

type UseDebouncedCallback = <A extends unknown[], R>(args: UseDebouncedCallbackArgs<A, R>) => UseDebouncedCallbackResult<A, R>;

export const useDebouncedCallback: UseDebouncedCallback = ({ callback, delay }) => {
  const functionTimeoutHandler = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFunction = useRef(callback);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

  const debouncedCallback: typeof callback = (...args) =>
    new Promise((resolve, reject) => {
      setIsLoading(true);
      if (functionTimeoutHandler.current) {
        clearTimeout(functionTimeoutHandler.current);
      }
      functionTimeoutHandler.current = setTimeout(() => {
        try {
          resolve(debouncedFunction.current(...args));
          setIsLoading(false);
          setHasLoadedOnce(true);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });

  useEffect(() => {
    if (!hasLoadedOnce || isLoading) {
      return;
    }
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
    }, 1e3);
  }, [hasLoadedOnce, isLoading]);

  return [debouncedCallback, isLoading, isDone];
};
