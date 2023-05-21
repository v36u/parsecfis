import { useCallback, useState, type FC } from 'react';

type Props = {
  publicKey: string;
};

const PublicKeyBadge: FC<Props> = ({ publicKey }) => {
  const [copyButtonIcon, setCopyButtonIcon] = useState<'fa-regular fa-copy' | 'fa-regular fa-check-circle'>('fa-regular fa-copy');

  const shortenedPublicKey = `...${publicKey.slice(-16)}`;

  const handleCopyButtonClick = useCallback(async () => {
    await navigator.clipboard.writeText(publicKey);

    setCopyButtonIcon('fa-regular fa-check-circle');
    const checkTimeout = setTimeout(() => {
      setCopyButtonIcon('fa-regular fa-copy');
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
        disabled={copyButtonIcon === 'fa-regular fa-check-circle'}
        onClick={handleCopyButtonClick}
      >
        <i className={copyButtonIcon} />
      </button>
    </div>
  );
};

export default PublicKeyBadge;
