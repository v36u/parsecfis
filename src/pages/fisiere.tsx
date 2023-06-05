import { type GetServerSideProps, type NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import { useState } from 'react';
import FileTable from '~/components/files/fileTable';
import { nextAuthOptions } from '~/server/auth';
import { type FileTablePageData } from '~/utils/@types/FileTablePageData';
import { api } from '~/utils/api';
import { filesPerPage } from '~/utils/constants';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

const defaultFileTablePageData: FileTablePageData = { rows: [], metadata: { totalFiles: 0, totalPages: 0 } };

const FilesPage: NextPage = () => {
  const [currentReceivedPage, setCurrentReceivedPage] = useState(1);
  const { data: receivedFilesTablePageData, isLoading: isReceivedFilesTablePageDataLoading } = api.file.getReceivedFiles.useQuery({
    currentPage: currentReceivedPage,
    filesPerPage,
  });

  const [currentSentPage, setCurrentSentPage] = useState(1);
  const { data: sentFilesTablePageData, isLoading: isSentFilesTablePageDataLoading } = api.file.getSentFiles.useQuery({
    currentPage: currentSentPage,
    filesPerPage,
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
          pageData={receivedFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isReceivedFilesTablePageDataLoading}
          currentPage={currentReceivedPage}
          setCurrentPage={setCurrentReceivedPage}
        />
        <h1 className="mb-6 mt-24 text-3xl font-bold">Fișiere trimise</h1>
        <FileTable
          sent
          pageData={sentFilesTablePageData ?? defaultFileTablePageData}
          isLoading={isSentFilesTablePageDataLoading}
          currentPage={currentSentPage}
          setCurrentPage={setCurrentSentPage}
        />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/',
        statusCode: HttpStatusCode.TEMPORARY_REDIRECT,
      },
    };
  }

  return {
    props: {},
  };
};

export default FilesPage;
