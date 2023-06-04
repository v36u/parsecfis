import classNames from 'classnames';
import { signIn } from 'next-auth/react';
import { useCallback, useState, type ChangeEvent, type FC } from 'react';
import { api } from '~/utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const UnauthenticatedHomeContent: FC = () => {
  const keyPairQuery = api.auth.createPrivateKey.useQuery();

  const [privateKey, setPrivateKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleTextAreaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrivateKey(event.target.value);
  };

  const [error, setError] = useState('');
  const handleAuthenticateButtonClick = useCallback(async () => {
    setError('');
    setIsLoading(true);

    const response = await signIn('private-key', {
      redirect: false,
      privateKey,
    });

    if (response?.error) {
      setError(response.error);
      setIsLoading(false);
      return;
    }
  }, [privateKey]);

  const handleGenerateButtonClick = useCallback(async () => {
    setError('');
    const privateKey = keyPairQuery.data;

    if (typeof privateKey !== 'string') {
      setError('Cheia privată nu a putut fi generată.');
      return;
    }

    setPrivateKey(privateKey);
    await keyPairQuery.refetch();
  }, [keyPairQuery]);

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Bine ai (re)venit!</h1>

      <label
        htmlFor="private-key"
        className="text-md mb-1 block font-bold text-gray-900 dark:text-slate-50"
      >
        Cheia privată
      </label>
      <input
        id="private-key"
        type="text"
        className="block w-9/12 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-purple-600 focus:ring-purple-600 dark:border-gray-600 dark:bg-gray-700 dark:text-slate-50 dark:placeholder-gray-400 dark:focus:border-purple-500 dark:focus:ring-purple-500 md:w-7/12 lg:w-5/12 xl:w-3/12"
        placeholder="Introdu cheia privată aici..."
        value={privateKey}
        onChange={handleTextAreaChange}
      />
      <div className="text-md bg-gradient-to-br from-red-800 to-red-500 bg-clip-text font-bold text-transparent">{error}</div>
      <button
        type="button"
        className={classNames(
          'mb-3 mt-6 inline-flex rounded-lg p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800',
          {
            'is-loading bg-slate-100': isLoading,
            'bg-gradient-to-br from-purple-600 to-blue-500': !isLoading,
          },
        )}
        onClick={handleAuthenticateButtonClick}
      >
        {isLoading && <LoadingSpinner />}
        <span className="px-5 py-2.5">Autentificare</span>
      </button>
      <button
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-gray-900 hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-slate-50 dark:focus:ring-blue-800"
        onClick={handleGenerateButtonClick}
      >
        <span className="relative rounded-md bg-slate-50 px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
          Generare cheie privată
        </span>
      </button>
    </>
  );
};

export default UnauthenticatedHomeContent;
