import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import AuthenticatedContent from "~/components/home/AuthenticatedContent";
import UnauthenticatedContent from "~/components/home/UnauthenticatedContent";

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

export default HomePage;
