import { faCheck, faCopy, faUser, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'flowbite-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FC } from 'react';

type Props = {
  publicKey: string;
  displayCopyButton?: boolean;
  displayProfileButton?: boolean;
};

const PublicKeyBadge: FC<Props> = ({ publicKey, displayCopyButton, displayProfileButton }) => {
  const [actualPublicKey, setActualPublicKey] = useState(publicKey);
  useEffect(() => {
    setActualPublicKey(publicKey);
  }, [publicKey]);

  const [copyButtonIcon, setCopyButtonIcon] = useState<IconDefinition>(faCopy);

  const shortenedPublicKey = `...${actualPublicKey.slice(-16)}`;

  const handleCopyButtonClick = useCallback(async () => {
    await navigator.clipboard.writeText(actualPublicKey);

    setCopyButtonIcon(faCheck);
    const checkTimeout = setTimeout(() => {
      setCopyButtonIcon(faCopy);
    }, 1500);

    return () => {
      clearTimeout(checkTimeout);
    };
  }, [actualPublicKey]);

  return (
    <div className="inline-flex items-center justify-center">
      <span className="py-gap-0.5.5 mr-2 rounded border border-purple-400 bg-purple-100 px-2.5 text-xs font-medium italic text-purple-800 dark:bg-gray-700 dark:text-purple-400">
        {shortenedPublicKey}
      </span>
      {displayCopyButton && (
        <Tooltip
          content="Copiază cheia publică"
          animation="duration-500"
        >
          <button
            type="button"
            className="py-gap-0.5.5 mr-2 rounded border border-purple-900 bg-yellow-100 px-1 text-xs font-medium text-purple-800 dark:bg-gray-700 dark:text-purple-400"
            disabled={copyButtonIcon.iconName === faCheck.iconName}
            onClick={handleCopyButtonClick}
          >
            <FontAwesomeIcon icon={copyButtonIcon} />
          </button>
        </Tooltip>
      )}
      {displayProfileButton && (
        <Tooltip
          content="Vezi profilul"
          animation="duration-500"
        >
          <Link
            href={`/profil/${publicKey}/`}
            className="py-gap-0.5.5 mr-2 rounded border border-purple-900 bg-yellow-100 px-1 text-xs font-medium text-purple-800 dark:bg-gray-700 dark:text-purple-400"
          >
            <FontAwesomeIcon icon={faUser} />
          </Link>
        </Tooltip>
      )}
    </div>
  );
};

export default PublicKeyBadge;
