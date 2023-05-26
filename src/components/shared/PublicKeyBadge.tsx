import { faCheck, faCopy, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useState, type FC } from 'react';

type Props = {
  publicKey: string;
};

const PublicKeyBadge: FC<Props> = ({ publicKey }) => {
  const [copyButtonIcon, setCopyButtonIcon] = useState<IconDefinition>(faCopy);

  const shortenedPublicKey = `...${publicKey.slice(-16)}`;

  const handleCopyButtonClick = useCallback(async () => {
    await navigator.clipboard.writeText(publicKey);

    setCopyButtonIcon(faCheck);
    const checkTimeout = setTimeout(() => {
      setCopyButtonIcon(faCopy);
    }, 1500);

    return () => {
      clearTimeout(checkTimeout);
    };
  }, [publicKey]);

  return (
    <div className="inline-flex italic">
      <span className="py-gap-0.5.5 mr-2 rounded border border-purple-400 bg-purple-100 px-2.5 text-xs font-medium text-purple-800 dark:bg-gray-700 dark:text-purple-400">
        {shortenedPublicKey}
      </span>
      <button
        type="button"
        title="Copiază cheia publică în clipboard"
        className="py-gap-0.5.5 mr-2 rounded border border-purple-900 bg-yellow-100 px-1 text-xs font-medium text-purple-800 dark:bg-gray-700 dark:text-purple-400"
        disabled={copyButtonIcon.iconName === faCheck.iconName}
        onClick={handleCopyButtonClick}
      >
        <FontAwesomeIcon icon={copyButtonIcon} />
      </button>
    </div>
  );
};

export default PublicKeyBadge;
