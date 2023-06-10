import { useSession } from 'next-auth/react';
import { createContext, useContext, type FC, type ReactNode } from 'react';
import { api } from '~/utils/api';

type AppContextModel = {
  numberOfNewReceivedFiles?: number;
  refetchNumberOfNewReceivedFiles: () => void;
};

const initialContextValue: AppContextModel = {
  numberOfNewReceivedFiles: undefined,
  refetchNumberOfNewReceivedFiles: () => {},
};

const AppContext = createContext(initialContextValue);

type AppContextProps = {
  children?: ReactNode;
};

export const AppContextProvider: FC<AppContextProps> = ({ children }) => {
  const session = useSession();

  const { data: numberOfNewReceivedFiles, refetch: refetchNumberOfNewReceivedFiles } = api.file.getNumberOfNewReceivedFiles.useQuery(undefined, {
    enabled: session.status === 'authenticated',
  });

  return (
    <AppContext.Provider
      value={{
        numberOfNewReceivedFiles,
        refetchNumberOfNewReceivedFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
