import { faCertificate, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { Navbar } from 'flowbite-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { type FC } from 'react';
import { useAppContext } from './appContext';

const Navigation: FC = () => {
  const { numberOfNewReceivedFiles } = useAppContext();
  const session = useSession();
  const { push } = useRouter();
  const handleLogoutButtonClick = async () => {
    await signOut({
      redirect: false,
    });
    await push('/');
  };

  const linkClassNames =
    'w-full block py-2 pr-4 pl-3 md:p-0 text-gray-700 hover:bg-gray-50 md:border-0 md:hover:bg-transparent md:hover:text-blue-700 md::bg-transparent md::text-white';

  const firstPageLinkLabel = session.status === 'unauthenticated' ? 'Autentificare' : 'Partajare';

  return (
    <Navbar
      fluid
      rounded
      className="fixed z-50 w-full list-none"
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
          <h1 className="ml-6 text-center text-3xl font-extrabold text-gray-900">
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">ParSecFis</span>
          </h1>
        </Link>
      </li>
      <Navbar.Toggle type="button" />
      <Navbar.Collapse>
        <li className="border-b border-gray-100 md:border-none">
          <Link
            className={linkClassNames}
            href="/"
          >
            {firstPageLinkLabel}
          </Link>
        </li>
        {session.status === 'authenticated' && (
          <>
            <li className="border-b border-gray-100 md:border-none">
              <Link
                className={linkClassNames}
                href="/profil/"
              >
                Profil
              </Link>
            </li>
            <li className="border-b border-gray-100 md:border-none">
              <Link
                className={classNames(linkClassNames, 'relative')}
                href="/fisiere/"
              >
                <div className="relative w-fit">
                  {!!numberOfNewReceivedFiles && numberOfNewReceivedFiles > 0 && (
                    <FontAwesomeIcon
                      className="text-2 absolute -right-4 h-3 w-3 rounded-full border-2 border-white font-bold text-purple-500 md:-right-3.5 md:-top-1"
                      icon={faCertificate}
                    />
                  )}
                  Fișiere
                </div>
              </Link>
            </li>
            <li className="border-b border-gray-100 md:border-none">
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
