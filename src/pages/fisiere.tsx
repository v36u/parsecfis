import { type GetServerSideProps, type NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import FileTable from '~/components/files/fileTable';
import { nextAuthOptions } from '~/server/auth';
import HttpStatusCode from '~/utils/enums/HttpStatusCode';

const FilesPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Fișiere &mdash; Parsecfis</title>
      </Head>
      <div className="flex w-full flex-col items-center justify-center">
        <h1 className="mb-6 text-3xl font-bold">Fișiere primite</h1>
        <FileTable received />
        <h1 className="mb-6 mt-24 text-3xl font-bold">Fișiere trimise</h1>
        <FileTable sent />
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
