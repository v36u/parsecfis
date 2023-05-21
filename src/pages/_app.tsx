import '@fortawesome/fontawesome-free/css/all.min.css';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type AppType } from 'next/app';
import Head from 'next/head';
import Image from 'next/image';
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
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <AppParticles />
      <SessionProvider session={session}>
        <main>
          <div className="mb-64 mt-12 flex items-center justify-center">
            <Image
              src="/parsecfis-logo.png"
              width={64}
              height={64}
              alt="Logo ParSecFis"
            />
            <h1 className="ml-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-50 md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">ParSecFis</span>
            </h1>
          </div>

          <Component {...pageProps} />
        </main>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
