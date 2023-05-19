import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";

const HomePage: NextPage = () => {
  const keyPair = api.utils.createKeyPair.useQuery({});

  return (
    <>
      <Head>
        <title>Parsecfis - Homepage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen flex-col items-center justify-center">
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        >
          Cheia privată
        </label>
        <textarea
          id="message"
          rows={6}
          className="mb-3 block w-6/12 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          placeholder="Write your thoughts here..."
        ></textarea>
        <button
          type="button"
          className="mb-3 inline-flex rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-white shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
        >
          <span className="px-5 py-2.5">Autentificare</span>
        </button>
        <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-gray-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-white dark:focus:ring-blue-800">
          <span className="relative rounded-md bg-white px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
            Generare cheie privată
          </span>
        </button>
      </div>
    </>
  );
};

export default HomePage;
