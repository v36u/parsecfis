import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type GetServerSideProps, type NextPage } from 'next';
import { getServerSession, type Session } from 'next-auth';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import FileTable from '~/components/files/FileTable';
import { nextAuthOptions } from '~/server/auth';
import { api } from '~/utils/api';
import { defaultFileTablePageData, filesPerPage } from '~/utils/constants';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

type Props = {
  serverSession: Session;
};

const FilesPage: NextPage<Props> = ({ serverSession }) => {
  const [currentReceivedPage, setCurrentReceivedPage] = useState(1);
  const { data: receivedFilesTablePageData, isLoading: isReceivedFilesTablePageDataLoading } = api.file.getReceivedFiles.useQuery({
    currentPage: currentReceivedPage,
    filesPerPage,
    deleted: false,
  });

  const [currentSentPage, setCurrentSentPage] = useState(1);
  const { data: sentFilesTablePageData, isLoading: isSentFilesTablePageDataLoading } = api.file.getSentFiles.useQuery({
    currentPage: currentSentPage,
    filesPerPage,
    deleted: false,
  });

  return (
    <>
      <Head>
        <title>Fișiere &mdash; Parsecfis</title>
      </Head>
      <div className="flex w-full flex-col items-center justify-center">
        <h1 className="mb-6 text-3xl font-bold">Fișiere primite</h1>
        <FileTable
          received
          session={serverSession}
          pageData={receivedFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isReceivedFilesTablePageDataLoading}
          currentPage={currentReceivedPage}
          setCurrentPage={setCurrentReceivedPage}
        />
        <h1 className="mb-6 mt-24 text-3xl font-bold">Fișiere trimise</h1>
        <FileTable
          sent
          session={serverSession}
          pageData={sentFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isSentFilesTablePageDataLoading}
          currentPage={currentSentPage}
          setCurrentPage={setCurrentSentPage}
        />
      </div>

      <div className="mt-12 flex items-center justify-center">
        <Link
          className="inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
          href="/fisiere/sterse/"
        >
          <span className="px-5 py-2.5">
            <FontAwesomeIcon icon={faTrashCan} /> Vezi fișierele șterse
          </span>
        </Link>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const serverSession = await getServerSession(req, res, nextAuthOptions);
  if (!serverSession) {
    return {
      redirect: {
        destination: '/',
        statusCode: HttpStatusCode.TEMPORARY_REDIRECT,
      },
    };
  }

  return {
    props: {
      serverSession,
    },
  };
};

export default FilesPage;
