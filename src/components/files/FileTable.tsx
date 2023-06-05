import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { Tooltip } from 'flowbite-react';
import { useMemo, type Dispatch, type FC, type SetStateAction } from 'react';
import invariant from 'tiny-invariant';
import { type FileTablePageData } from '~/utils/@types/FileTablePageData';
import { filesPerPage } from '~/utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';
import PublicKeyBadge from '../shared/PublicKeyBadge';

const ELLIPSIS = '...';

type Props = {
  sent?: boolean;
  received?: boolean;

  pageData: FileTablePageData;
  isLoading: boolean;

  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

const FileTable: FC<Props> = ({ sent, received, pageData: { rows, metadata }, isLoading, currentPage, setCurrentPage }) => {
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

  return (
    <div
      className={classNames('relative w-11/12 overflow-x-auto shadow-2xl sm:rounded-lg md:w-10/12 lg:w-8/12', {
        'is-loading': isLoading,
      })}
    >
      {isLoading && <LoadingSpinner />}
      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-slate-200 bg-opacity-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
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
              Data partajării
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
              Acțiuni
            </th>
          </tr>
        </thead>
        <tbody>
          {metadata.totalFiles === 0 && (
            <tr className="border-y bg-slate-50 bg-opacity-95 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
              <td
                className="py-4 text-center"
                colSpan={4}
              >
                {sent && 'Nu ai trimis niciun fișier încă.'}
                {received && 'Nu ai primit niciun fișier încă.'}
              </td>
            </tr>
          )}
          {rows.map((file) => (
            <tr
              key={`${file.iv}-${file.sharedAt}-${file.publicKey}-${file.fileName}`}
              className="border-y bg-slate-50 bg-opacity-95 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
            >
              <td className="py-4 text-center">{file.fileName}</td>
              <td className="py-4 text-center">{file.sharedAt}</td>
              <td className="py-4 text-center">
                <PublicKeyBadge publicKey={file.publicKey} />
              </td>
              <td className="flex items-center justify-center py-4">
                <button className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                  <Tooltip
                    content="Descarcă"
                    animation="duration-500"
                  >
                    <FontAwesomeIcon
                      icon={faDownload}
                      size="lg"
                    />
                  </Tooltip>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {metadata.totalFiles > 1 && (
        <nav className="flex items-center justify-between bg-slate-200 bg-opacity-50 p-4">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Se afișează{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {(currentPage - 1) * filesPerPage + 1}-{isLastPage ? metadata.totalFiles : currentPage * filesPerPage}
            </span>{' '}
            din <span className="font-semibold text-gray-900 dark:text-white">{metadata.totalFiles}</span>
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
                      'ml-0 block rounded-l-lg border border-gray-300 bg-white bg-opacity-80 px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
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
                      className={classNames(
                        'block border bg-opacity-80 px-3 py-2 leading-tight hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
                        {
                          'border-blue-300 bg-blue-50 text-blue-600': paginationItem === currentPage.toString(),
                          'border-gray-300 bg-white text-gray-500': paginationItem !== currentPage.toString(),
                          'pointer-events-none': isCurrentPage || isEllipsis,
                        },
                      )}
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
                      'ml-0 block rounded-r-lg border border-gray-300 bg-white bg-opacity-80 px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
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
  );
};

export default FileTable;
