import { faClose, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { createECDH } from 'crypto';
import { Button, Modal, Tooltip } from 'flowbite-react';
import { type Session } from 'next-auth';
import { useEffect, useMemo, useState, type Dispatch, type FC, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import invariant from 'tiny-invariant';
import { type FileTablePageData, type FileTablePageRow } from '~/utils/@types/FileTablePageData';
import { api } from '~/utils/api';
import { eccCurveName, filesPerPage } from '~/utils/constants';
import { decrypt } from '~/utils/helpers/encryption';
import { getFileTablePageRowKey } from '~/utils/helpers/file';
import { getBufferFromReaderResult } from '~/utils/helpers/shared';
import { useAppContext } from '../_app/appContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import FileTableRow from './FileTableRow';

const ELLIPSIS = '...';

type Props = {
  deleted?: boolean;
  received?: boolean;
  sent?: boolean;

  session: Session;

  pageData: FileTablePageData;
  isLoading: boolean;
  refetchPageData: () => void;

  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

const FileTable: FC<Props> = ({ received, sent, deleted, session, pageData: { rows, metadata }, isLoading, refetchPageData, currentPage, setCurrentPage }) => {
  invariant(!(sent && received) && (sent || received), 'Invalid file table parameters.');

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= metadata.totalPages) {
      setCurrentPage(page);
    }
  };

  const paginationItems = useMemo(() => {
    const pageNumbers = ['1'];

    for (let pageNumber = 2; pageNumber <= metadata.totalPages - 1; pageNumber = pageNumber + 1) {
      const isNearCurrent = pageNumber <= currentPage + 1 && pageNumber >= currentPage - 1;
      const isEllipsis = pageNumber === currentPage - 2 || pageNumber === currentPage + 2;

      if (isNearCurrent) {
        pageNumbers.push(pageNumber.toString());
      } else if (isEllipsis && pageNumbers[pageNumbers.length - 1] !== ELLIPSIS) {
        pageNumbers.push(ELLIPSIS);
      }
    }
    if (metadata.totalPages > 1) {
      pageNumbers.push(metadata.totalPages.toString());
    }

    return pageNumbers;
  }, [currentPage, metadata.totalPages]);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === metadata.totalPages;

  const [rowBeingDownloaded, setRowBeingDownloaded] = useState<FileTablePageRow | null>(null);
  const { data: downloadData } = api.file.initiateFileDownload.useQuery(rowBeingDownloaded as FileTablePageRow, {
    enabled: !!rowBeingDownloaded,
  });

  const { refetchNumberOfNewReceivedFiles } = useAppContext();

  const handleDownloadButtonClick = (row: FileTablePageRow) => {
    setRowBeingDownloaded(row);
  };
  useEffect(() => {
    if (!rowBeingDownloaded || !downloadData) {
      return;
    }

    fetch(downloadData.signedGetUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();

        const { otherParticipantPublicKey } = rowBeingDownloaded;
        const ecdh = createECDH(eccCurveName);
        ecdh.setPrivateKey(Buffer.from(session.user.privateKey, 'hex'));

        const symmetricKey = ecdh.computeSecret(Buffer.from(otherParticipantPublicKey, 'hex')).toString('hex');

        reader.onloadend = (event) => {
          const result = event.target?.result;
          if (!result) {
            console.error('A intervenit o eroare. Te rugăm să reîncerci.');
            return;
          }

          const resultBuffer = getBufferFromReaderResult(result);
          const { decryptedBuffer: decryptedResultBuffer } = decrypt(resultBuffer, symmetricKey);
          const decryptedBlob = new Blob([decryptedResultBuffer], {
            type: blob.type,
          });

          const url = window.URL.createObjectURL(decryptedBlob);
          const temporaryAnchor = document.createElement('a');
          temporaryAnchor.href = url;
          temporaryAnchor.download = rowBeingDownloaded.fileName;
          temporaryAnchor.style.display = 'none';
          temporaryAnchor.style.visibility = 'hidden';
          temporaryAnchor.style.opacity = '0';

          document.body.appendChild(temporaryAnchor);
          temporaryAnchor.click();

          temporaryAnchor.remove();
        };

        reader.readAsArrayBuffer(blob);
      })
      .catch((error) => {
        console.error(error);
      });

    setRowBeingDownloaded(null);
    refetchPageData();
    refetchNumberOfNewReceivedFiles();
  }, [downloadData, refetchNumberOfNewReceivedFiles, refetchPageData, rowBeingDownloaded, session.user.privateKey]);

  const [rowBeingDeleted, setRowBeingDeleted] = useState<FileTablePageRow | null>(null);
  const { mutate: deleteFile, isSuccess: isDeleteFileSuccess, reset: resetDeleteFile } = api.file.deleteFile.useMutation();
  const handleDeletionModalClose = () => {
    setRowBeingDeleted(null);
  };
  const handleDeleteButtonClick = (row: FileTablePageRow) => {
    setRowBeingDeleted(row);
  };
  const handleConfirmDeletionClick = () => {
    if (!rowBeingDeleted) {
      throw new Error('A apărut o eroare neașteptată.');
    }
    deleteFile(rowBeingDeleted);
  };
  const handleCancelDeletionClick = () => {
    handleDeletionModalClose();
  };
  useEffect(() => {
    if (!isDeleteFileSuccess) {
      return;
    }
    refetchPageData();
    refetchNumberOfNewReceivedFiles();

    if (rowBeingDeleted) {
      toast(
        (t) => (
          <div className="flex">
            <p>
              Fișierul &quot;<em>{rowBeingDeleted.fileName}</em>&quot; a fost <strong>șters</strong> cu succes.
            </p>
            <button onClick={() => toast.dismiss(t.id)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
        ),
        {
          duration: 5e3,
          icon: <FontAwesomeIcon icon={faTrashCan} />,
          position: 'top-center',
          style: {
            background: 'rgb(249 200 200)',
            color: 'rgb(155 28 28)',
          },
        },
      );
    }
    resetDeleteFile();
    setRowBeingDeleted(null);
  }, [isDeleteFileSuccess, refetchNumberOfNewReceivedFiles, refetchPageData, resetDeleteFile, rowBeingDeleted]);

  return (
    <>
      <div
        className={classNames('relative w-11/12 overflow-x-auto shadow-2xl sm:rounded-lg md:w-10/12 lg:w-8/12', {
          'is-loading': isLoading,
        })}
      >
        {isLoading && <LoadingSpinner />}
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-slate-200 bg-opacity-50 text-xs uppercase text-gray-700 ">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-center"
              >
                Nume
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center"
              >
                {sent && 'Trimis către'}
                {received && 'Primit de la'}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center"
              >
                Data partajării
              </th>
              {deleted && (
                <>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center"
                  >
                    Data ștergerii
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center"
                  >
                    Motivul ștergerii
                  </th>
                </>
              )}
              {!deleted && (
                <th
                  scope="col"
                  className="px-6 py-3 text-center"
                >
                  Acțiuni
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {metadata.totalFiles === 0 && (
              <tr className="bg-slate-50 bg-opacity-95 hover:bg-white">
                <td
                  className="py-4 text-center"
                  colSpan={deleted ? 5 : 4}
                >
                  {sent && (deleted ? 'Nu există fișiere trimise șterse.' : 'Nu există fișiere trimise disponibile.')}
                  {received && (deleted ? 'Nu există fișiere primite șterse.' : 'Nu există fișiere primite disponibile.')}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const rowKey = getFileTablePageRowKey(row);

              return (
                <FileTableRow
                  key={rowKey}
                  deleted={deleted}
                  sent={sent}
                  received={received}
                  row={row}
                  handleDownload={handleDownloadButtonClick}
                  handleDelete={handleDeleteButtonClick}
                  downloadIsLoading={!!rowBeingDownloaded && getFileTablePageRowKey(rowBeingDownloaded) === rowKey}
                  deleteIsLoading={!!rowBeingDeleted && getFileTablePageRowKey(rowBeingDeleted) === rowKey}
                />
              );
            })}
          </tbody>
        </table>
        {metadata.totalFiles > 1 && (
          <nav className="flex items-center justify-between bg-slate-200 bg-opacity-50 p-4">
            <span className="text-sm font-normal text-gray-500">
              Se afișează{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * filesPerPage + 1}-{isLastPage ? metadata.totalFiles : currentPage * filesPerPage}
              </span>{' '}
              din <span className="font-semibold text-gray-900">{metadata.totalFiles}</span>
            </span>
            {metadata.totalPages > 1 && (
              <ul className="inline-flex items-center -space-x-px">
                <li>
                  <Tooltip
                    content="Pagina anterioară"
                    animation="duration-500"
                  >
                    <button
                      type="button"
                      disabled={isFirstPage}
                      className={classNames(
                        'ml-0 block rounded-l-lg border border-gray-300 bg-white bg-opacity-80 px-3 py-2 leading-tight text-gray-500    hover:bg-gray-100 hover:text-gray-700',
                        {
                          'pointer-events-none opacity-50': isFirstPage,
                        },
                      )}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <svg
                        className="h-5 w-5"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </Tooltip>
                </li>
                {paginationItems.map((paginationItem, index) => {
                  const isCurrentPage = paginationItem === currentPage.toString();
                  const isEllipsis = paginationItem === ELLIPSIS;

                  return (
                    <li key={isEllipsis ? `${ELLIPSIS}${paginationItems[index - 1] as string}` : paginationItem}>
                      <button
                        type="button"
                        disabled={isCurrentPage || isEllipsis}
                        className={classNames('block border bg-opacity-80 px-3 py-2 leading-tight hover:bg-gray-100 hover:text-gray-700', {
                          'border-blue-300 bg-blue-50 text-blue-600': paginationItem === currentPage.toString(),
                          'border-gray-300 bg-white text-gray-500': paginationItem !== currentPage.toString(),
                          'pointer-events-none': isCurrentPage || isEllipsis,
                        })}
                        onClick={() => {
                          if (isEllipsis) {
                            return;
                          }
                          setCurrentPage(Number(paginationItem));
                        }}
                      >
                        {paginationItem}
                      </button>
                    </li>
                  );
                })}
                <li>
                  <Tooltip
                    content="Pagina următoare"
                    animation="duration-500"
                  >
                    <button
                      type="button"
                      disabled={isLastPage}
                      className={classNames(
                        'ml-0 block rounded-r-lg border border-gray-300 bg-white bg-opacity-80 px-3 py-2 leading-tight text-gray-500    hover:bg-gray-100 hover:text-gray-700',
                        {
                          'pointer-events-none opacity-50': isLastPage,
                        },
                      )}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <svg
                        className="h-5 w-5"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </Tooltip>
                </li>
              </ul>
            )}
          </nav>
        )}
      </div>

      <Modal
        show={!!rowBeingDeleted}
        onClose={handleDeletionModalClose}
      >
        <Modal.Header>Confirmare ștergere fișier</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            Confirmi că dorești să <strong>ștergi</strong> fișierul &quot;<em>{rowBeingDeleted?.fileName}</em>&quot;?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            onClick={handleConfirmDeletionClick}
          >
            Confirm
          </Button>
          <Button
            color="gray"
            onClick={handleCancelDeletionClick}
          >
            Înapoi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileTable;
