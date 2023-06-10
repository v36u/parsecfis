import { faCertificate, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { Navbar } from 'flowbite-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { type FC } from 'react';
import { api } from '~/utils/api';

const Navigation: FC = () => {
  const session = useSession();
  const { push } = useRouter();
  const handleLogoutButtonClick = async () => {
    await signOut({
      redirect: false,
    });
    await push('/');
  };

  const linkClassNames =
    'block py-2 pr-4 pl-3 md:p-0 border-b border-gray-100  text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white';

  const firstPageLinkLabel = session.status === 'unauthenticated' ? 'Autentificare' : 'Partajare';

  const { data: numberOfNewReceivedFiles } = api.file.getNumberOfNewReceivedFiles.useQuery();

  return (
    <Navbar
      fluid
      rounded
      className="fixed w-full list-none"
    >
      <li>
        <Link
          className="flex items-center"
          href="/"
        >
          <Image
            src="/parsecfis-logo.png"
            width={42}
            height={42}
            alt="Logo ParSecFis"
          />
          <h1 className="ml-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-50">
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">ParSecFis</span>
          </h1>
        </Link>
      </li>
      <Navbar.Toggle type="button" />
      <Navbar.Collapse>
        <Link
          className={linkClassNames}
          href="/"
        >
          {firstPageLinkLabel}
        </Link>
        {session.status === 'authenticated' && (
          <>
            <li>
              <Link
                className={linkClassNames}
                href="/profil/"
              >
                Profil
              </Link>
            </li>
            <li>
              <Link
                className={classNames(linkClassNames, 'relative')}
                href="/fisiere/"
              >
                {!!numberOfNewReceivedFiles && numberOfNewReceivedFiles > 0 && (
                  <FontAwesomeIcon
                    className="text-2 absolute -right-3.5 -top-1 h-3 w-3 rounded-full border-2 border-white font-bold text-purple-500"
                    icon={faCertificate}
                  />
                )}
                Fișiere
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogoutButtonClick}
                className={classNames(linkClassNames, 'flex items-center gap-2')}
              >
                <FontAwesomeIcon icon={faSignOut} /> Deconectare
              </button>
            </li>
          </>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
