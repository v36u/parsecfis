import classNames from 'classnames';
import { createECDH } from 'crypto';
import { Button, Modal } from 'flowbite-react';
import { signIn } from 'next-auth/react';
import { useCallback, useEffect, useState, type ChangeEvent, type FC } from 'react';
import { api } from '~/utils/api';
import { eccCurveName } from '~/utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const UnauthenticatedHomeContent: FC = () => {
  const keyPairQuery = api.auth.createPrivateKey.useQuery();

  const [privateKey, setPrivateKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleTextAreaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrivateKey(event.target.value);
  };

  const [displayConfirmationModal, setDisplayConfirmationModal] = useState(false);

  const handleAuthentication = useCallback(async () => {
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

  const [error, setError] = useState('');
  const [userToBeLoggedInPublicKey, setUserToBeLoggedInPublicKey] = useState<string | null>(null);
  const {
    data: userToBeLoggedIn,
    isSuccess: userToBeLoggedInQuerySuccess,
    isFetching: userToBeLoggedInIsLoading,
  } = api.user.fetchUser.useQuery(
    {
      publicKey: userToBeLoggedInPublicKey as string,
    },
    {
      enabled: !!userToBeLoggedInPublicKey,
    },
  );
  const handleAuthenticateButtonClick = () => {
    if (privateKey.length < 1) {
      setError('Cheia privată nu a fost furnizată.');
      return;
    }

    setError('');
    setIsLoading(true);

    const ecdh = createECDH(eccCurveName);
    ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

    const publicKey = ecdh.getPublicKey('hex');

    setUserToBeLoggedInPublicKey(publicKey);
  };
  useEffect(() => {
    if (userToBeLoggedInIsLoading || !userToBeLoggedInQuerySuccess) {
      return;
    }
    if (!!userToBeLoggedIn) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleAuthentication();
    } else {
      setDisplayConfirmationModal(true);
    }

    setUserToBeLoggedInPublicKey(null);
  }, [handleAuthentication, userToBeLoggedIn, userToBeLoggedInIsLoading, userToBeLoggedInQuerySuccess]);

  const handleConfirmationModalClose = () => {
    setDisplayConfirmationModal(false);
  };
  const handleISavedButtonClick = async () => {
    handleConfirmationModalClose();
    await handleAuthentication();
  };
  const handleIDidNotSaveButtonClick = () => {
    handleConfirmationModalClose();
    setIsLoading(false);
  };

  const handleGenerateButtonClick = async () => {
    setError('');
    const privateKey = keyPairQuery.data;

    if (typeof privateKey !== 'string') {
      setError('Cheia privată nu a putut fi generată.');
      return;
    }

    setPrivateKey(privateKey);
    await keyPairQuery.refetch();
  };

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Bine ai (re)venit!</h1>

      <label
        htmlFor="private-key"
        className="text-md mb-1 block font-bold text-gray-900"
      >
        Cheia privată
      </label>
      <input
        id="private-key"
        type="text"
        className="block w-11/12 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-purple-600 focus:ring-purple-600 sm:w-8/12 md:w-6/12 lg:w-5/12 xl:w-3/12"
        placeholder="Introdu cheia privată aici..."
        value={privateKey}
        onChange={handleTextAreaChange}
      />
      <div className="text-md bg-gradient-to-br from-red-800 to-red-500 bg-clip-text font-bold text-transparent">{error}</div>
      <button
        type="button"
        className={classNames(
          'group relative mb-3 mt-6 inline-flex items-center justify-center overflow-hidden rounded-lg p-0.5 text-sm font-medium text-gray-900 hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600  group-hover:to-blue-500',
          {
            'is-loading bg-slate-100': isLoading,
            'bg-gradient-to-br from-purple-600 to-blue-500': !isLoading,
          },
        )}
        onClick={handleAuthenticateButtonClick}
      >
        {isLoading && <LoadingSpinner />}
        <span className="relative rounded-md bg-slate-50 px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0">Autentificare</span>
      </button>
      <button
        type="button"
        className="inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300"
        onClick={handleGenerateButtonClick}
      >
        <span className="px-5 py-2.5">Generare cheie privată</span>
      </button>

      <Modal
        show={displayConfirmationModal}
        onClose={handleIDidNotSaveButtonClick}
      >
        <Modal.Header>Confirmare înregistrare</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-gray-500">
              Înainte de a continua, este esențial să îți asiguri siguranța datelor prin salvarea cheii private pe care ai introdus-o. Te rugăm să acorzi o
              atenție deosebită acestui pas.
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              Această cheie privată este un instrument unic și esențial pentru criptarea și accesarea fișierelor tale. Odată salvată, nu există nicio metodă
              prin care noi putem să o recuperăm sau să o reînnoim în numele tău. Prin urmare, este crucial să o salvezi într-un loc sigur și accesibil pentru
              tine.
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              Dacă pierzi această cheie, <strong>vei pierde accesul la toate fișierele tale criptate</strong>, deoarece acestea nu pot fi decriptate fără ea.
              Aceasta este o măsură de securitate puternică care îți protejează datele, dar care necesită de asemenea și responsabilitate din partea ta pentru
              a-ți asigura accesul la acestea în viitor.
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              <strong>Recomandări de stocare:</strong>
            </p>
            <ol className="list-inside list-decimal space-y-4 text-gray-500">
              <li>
                <span className="font-semibold">Stocarea offline (Recomandată):</span> Stocarea offline este cea mai sigură metodă. Există două modalități
                principale prin care poți stoca cheia offline:
                <ol className="mt-2 list-inside list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">Hârtie:</span> Poți să-ți scrii manual cheia pe o bucată de hârtie sau să o printezi și apoi să o păstrezi
                    într-un loc sigur, cum ar fi un seif.
                  </li>
                  <li>
                    <span className="font-semibold">Dispozitiv de stocare offline:</span> Poți utiliza un dispozitiv de stocare offline, precum un stick USB sau
                    un YubiKey, pe care îl păstrezi într-un loc sigur.
                  </li>
                </ol>
              </li>
              <li>
                <span className="font-semibold">Manager de parole:</span> Există multe aplicații specializate pentru stocarea în siguranță a parolelor și
                cheilor private. Acestea folosesc criptare de nivel înalt pentru a-ți proteja informațiile. Unele exemple populare includ LastPass, 1Password și
                Bitwarden.
              </li>
              <li>
                <span className="font-semibold">Stocare pe dispozitivul tău:</span> Poți stoca cheia pe computerul sau telefonul tău, într-un fișier. Totuși,
                pentru a asigura un nivel înalt de securitate, îți recomandăm să folosești un fișier criptat. Sistemele de operare moderne oferă metode de
                criptare a fișierelor. Asigură-te că ai o parolă puternică pentru acest fișier.
              </li>
            </ol>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleISavedButtonClick}>Am salvat cheia privată</Button>
          <Button
            color="gray"
            onClick={handleIDidNotSaveButtonClick}
          >
            Nu am salvat încă
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UnauthenticatedHomeContent;
