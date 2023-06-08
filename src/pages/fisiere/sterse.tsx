import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
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

const DeletedFilesPage: NextPage<Props> = ({ serverSession }) => {
  const [currentReceivedPage, setCurrentReceivedPage] = useState(1);
  const {
    data: receivedFilesTablePageData,
    isLoading: isReceivedFilesTablePageDataLoading,
    refetch: refetchCurrentReceivedPage,
  } = api.file.getReceivedFiles.useQuery({
    currentPage: currentReceivedPage,
    filesPerPage,
    deleted: true,
  });

  const [currentSentPage, setCurrentSentPage] = useState(1);
  const {
    data: sentFilesTablePageData,
    isLoading: isSentFilesTablePageDataLoading,
    refetch: refetchCurrentSentPage,
  } = api.file.getSentFiles.useQuery({
    currentPage: currentSentPage,
    filesPerPage,
    deleted: true,
  });

  return (
    <>
      <Head>
        <title>Coș de gunoi &mdash; Parsecfis</title>
      </Head>
      <div className="flex w-full flex-col items-center justify-center">
        <h1 className="mb-6 text-3xl font-bold">Fișiere primite șterse</h1>
        <FileTable
          deleted
          received
          session={serverSession}
          pageData={receivedFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isReceivedFilesTablePageDataLoading}
          refetchPageData={refetchCurrentReceivedPage}
          currentPage={currentReceivedPage}
          setCurrentPage={setCurrentReceivedPage}
        />
        <h1 className="mb-6 mt-24 text-3xl font-bold">Fișiere trimise șterse</h1>
        <FileTable
          deleted
          sent
          session={serverSession}
          pageData={sentFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isSentFilesTablePageDataLoading}
          refetchPageData={refetchCurrentSentPage}
          currentPage={currentSentPage}
          setCurrentPage={setCurrentSentPage}
        />
      </div>

      <div className="mt-12 flex items-center justify-center">
        <Link
          className="inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
          href="/fisiere/"
        >
          <span className="px-5 py-2.5">
            <FontAwesomeIcon icon={faArrowLeft} /> Înapoi la fișierele tale
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

export default DeletedFilesPage;
