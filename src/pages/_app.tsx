import '@fortawesome/fontawesome-free/css/all.min.css';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Analytics } from '@vercel/analytics/react';
import 'flowbite';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type AppType } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import AppParticles from '~/components/_app/AppParticles';
import Navigation from '~/components/_app/Navigation';
import '~/styles/globals.css';
import { api } from '~/utils/api';

faConfig.autoAddCss = false;

const Toaster = dynamic(() => import('react-hot-toast').then((c) => c.Toaster), {
  ssr: false,
});

const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Realizat de Dumitru A. Vlad, Grupa 302"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <AppParticles />
      <SessionProvider session={session}>
        <Navigation />
        <main className="align-center flex min-h-screen flex-col justify-center">
          <Component {...pageProps} />
          <Toaster />
          <Analytics />
        </main>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
