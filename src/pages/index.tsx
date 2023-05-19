import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";

const HomePage: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>Parsecfis - Homepage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <p className="text-2xl">
          {hello.data ? hello.data.greeting : "Loading tRPC query..."}
        </p>
      </div>
    </>
  );
};

export default HomePage;
