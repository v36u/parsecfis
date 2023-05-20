import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { api } from "~/utils/api";

const HomePage: NextPage = () => {
  const session = useSession();

  return (
    <>
      <Head>
        <title>Parsecfis - Homepage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mb-48 mt-6 flex items-center justify-center">
        <Image
          src="/parsecfis-logo.png"
          width={64}
          height={64}
          alt="Logo ParSecFis"
        />
        <h1 className="ml-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            ParSecFis
          </span>
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center">
        {session.status === "unauthenticated" && <UnauthenticatedContent />}
        {session.status === "authenticated" && <AuthenticatedContent />}
      </div>
    </>
  );
};

const UnauthenticatedContent: NextPage = () => {
  const keyPair = api.auth.createPrivateKey.useQuery({});

  const [privateKey, setPrivateKey] = useState("");
  const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateKey(event.target.value);
  };

  const [error, setError] = useState("");
  const handleAuthenticateButtonClick = async () => {
    const response = await signIn("private-key", {
      redirect: false,
      privateKey,
    });

    if (response?.error) {
      setError(response.error);
    }
  };

  const handleGenerateButtonClick = async () => {
    const privateKey = keyPair.data;

    if (typeof privateKey !== "string") {
      setError("Cheia privată nu a putut fi generată.");
      return;
    }

    setPrivateKey(privateKey);
    await keyPair.refetch();
  };

  return (
    <>
      <label
        htmlFor="private-key"
        className="mb-2 block text-2xl font-bold  text-gray-900 dark:text-slate-50"
      >
        Cheia privată
      </label>
      <textarea
        id="private-key"
        rows={6}
        className="block w-9/12 rounded-lg border border-gray-300 bg-slate-100 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-slate-50 dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 xl:w-6/12"
        placeholder="Introdu cheia privată aici..."
        value={privateKey}
        onChange={handleTextAreaChange}
      ></textarea>
      <div className="text-md bg-gradient-to-br from-red-600 to-red-500 bg-clip-text font-bold text-transparent">
        {error}
      </div>
      <button
        type="button"
        className="mb-3 mt-6 inline-flex rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
        onClick={handleAuthenticateButtonClick}
      >
        <span className="px-5 py-2.5">Autentificare</span>
      </button>
      <button
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-gray-900 hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-slate-50 dark:focus:ring-blue-800"
        onClick={handleGenerateButtonClick}
      >
        <span className="relative rounded-md bg-slate-50 px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
          Generare cheie privată
        </span>
      </button>
    </>
  );
};

const AuthenticatedContent: NextPage = () => {
  const handleLogoutButtonClick = async () => {
    await signOut({
      redirect: false,
    });
  };

  return (
    <>
      <div className="flex w-9/12 items-center justify-center xl:w-6/12">
        <label
          htmlFor="dropzone-file"
          className="dark:hover:bg-bray-800 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pb-6 pt-5">
            <svg
              aria-hidden="true"
              className="mb-3 h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SVG, PNG, JPG or GIF (MAX. 800x400px)
            </p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" />
        </label>
      </div>

      <button
        className="group relative mt-3 inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-gray-900 hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-slate-50 dark:focus:ring-blue-800"
        onClick={handleLogoutButtonClick}
      >
        <span className="relative rounded-md bg-slate-50 px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
          Deconectare
        </span>
      </button>
    </>
  );
};

export default HomePage;
