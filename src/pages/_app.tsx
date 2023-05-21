import '@fortawesome/fontawesome-free/css/all.min.css';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type AppType } from 'next/app';
import Head from 'next/head';
import AppParticles from '~/components/_app/AppParticles';
import '~/styles/globals.css';
import { api } from '~/utils/api';

faConfig.autoAddCss = false;

const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Realizat de Dumitru A. Vlad, Grupa 302"
        />
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
