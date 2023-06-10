import { faCertificate, faDownload, faEllipsisH, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DeletionReason } from '@prisma/client';
import classNames from 'classnames';
import { Tooltip } from 'flowbite-react';
import { useEffect, useState, type FC } from 'react';
import invariant from 'tiny-invariant';
import { type FileTablePageRow } from '~/utils/@types/FileTablePageData';
import PublicKeyBadge from '../shared/PublicKeyBadge';

type Props = {
  row: FileTablePageRow;
  deleted?: boolean;
  received?: boolean;
  sent?: boolean;
  handleDownload: (row: FileTablePageRow) => void;
  handleDelete: (row: FileTablePageRow) => void;
  downloadIsLoading: boolean;
  deleteIsLoading: boolean;
};

const initialDownloadIcon = faDownload;
const initialDeleteIcon = faTrashCan;

const FileTableRow: FC<Props> = ({ row, received, sent, deleted, handleDownload, handleDelete, downloadIsLoading, deleteIsLoading }) => {
  invariant(!(sent && received) && (sent || received), 'Invalid file table parameters.');

  const [downloadIcon, setDownloadIcon] = useState(initialDownloadIcon);
  const [deleteIcon, setDeleteIcon] = useState(initialDeleteIcon);

  useEffect(() => {
    if (downloadIsLoading) {
      setDownloadIcon(faEllipsisH);
    } else {
      setDownloadIcon(initialDownloadIcon);
    }
  }, [downloadIsLoading]);

  useEffect(() => {
    if (deleteIsLoading) {
      setDeleteIcon(faEllipsisH);
    } else {
      setDeleteIcon(initialDeleteIcon);
    }
  }, [deleteIsLoading]);

  return (
    <tr className="border-y bg-slate-50 bg-opacity-95 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
      <td className="py-4 text-center">{row.fileName}</td>
      <td className="py-4 text-center">
        <PublicKeyBadge
          publicKey={row.otherParticipantPublicKey}
          displayProfileButton
        />
      </td>
      <td className="py-4 text-center">{row.sharedAt}</td>
      {deleted && (
        <>
          <td className="py-4 text-center">{row.deletedAt}</td>
          <td className="py-4 text-center">
            {received && (row.deletionReason === DeletionReason.DeletedByReceiver ? 'Șters de către tine' : 'Șters de către emițător')}
            {sent && (row.deletionReason === DeletionReason.DeletedBySender ? 'Șters de către tine' : 'Șters de către receptor')}
          </td>
        </>
      )}
      {!deleted && (
        <td className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            onClick={() => handleDownload(row)}
          >
            <Tooltip
              content="Descărcare"
              animation="duration-500"
            >
              {row.isNew && (
                <FontAwesomeIcon
                  className="text-2 absolute -right-3.5 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white font-bold text-purple-500"
                  icon={faCertificate}
                />
              )}

              <FontAwesomeIcon
                icon={downloadIcon}
                size="lg"
                className={classNames({
                  'fa-bounce': downloadIcon.iconName === faEllipsisH.iconName,
                })}
              />
            </Tooltip>
          </button>
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            onClick={() => handleDelete(row)}
          >
            <Tooltip
              content="Ștergere"
              animation="duration-500"
            >
              <FontAwesomeIcon
                icon={deleteIcon}
                size="lg"
                className={classNames({
                  'fa-bounce': deleteIcon.iconName === faEllipsisH.iconName,
                })}
              />
            </Tooltip>
          </button>
        </td>
      )}
    </tr>
  );
};

export default FileTableRow;
