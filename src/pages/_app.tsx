import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type AppType } from 'next/app';

import { api } from '~/utils/api';

import Head from 'next/head';
import AppParticles from '~/components/_app/AppParticles';
import '~/styles/globals.css';

const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <>
      <Head>
        <meta name="description" content="Realizat de Dumitru A. Vlad, Grupa 302" />
      </Head>
      <AppParticles />
      <SessionProvider session={session}>
        <main>
          <Component {...pageProps} />
        </main>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
