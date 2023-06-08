import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { createECDH } from 'crypto';
import { type GetServerSidePropsContext } from 'next';
import { getServerSession, type DefaultSession, type NextAuthOptions, type User } from 'next-auth';
import { env } from '~/env.mjs';
import { prisma } from '~/server/db';
import { eccCurveName } from '~/utils/constants';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      privateKey: string;
      publicKey: string;
    };
  }

  interface User {
    privateKey: string;
    publicKey: string;
  }

  interface Profile {
    privateKey: string;
    publicKey: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    publicKey: string;
    privateKey: string;
  }
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    {
      id: 'private-key',
      name: 'Private Key',
      type: 'credentials',
      credentials: {
        privateKey: {
          label: 'Cheia privată',
          type: 'text',
        },
      },
      async authorize(credentials) {
        if (!credentials?.privateKey) {
          throw new Error('Cheia privată nu a fost furnizată.');
        }
        if (credentials.privateKey.length !== 64) {
          throw new Error('Această cheie privată este invalidă.');
        }

        try {
          const ecdh = createECDH(eccCurveName);
          ecdh.setPrivateKey(Buffer.from(credentials.privateKey, 'hex'));

          const publicKey = ecdh.getPublicKey('hex');

          // Adăugăm un nou utilizator dacă nu există deja
          const user = await prisma.appUser.upsert({
            where: {
              publicKey,
            },
            update: {},
            create: {
              publicKey,
            },
          });

          const authenticatedUser: User = {
            id: user.id.toString(),
            publicKey,
            privateKey: credentials.privateKey,
          };

          return authenticatedUser;
        } catch (_) {
          throw new Error('Această cheie privată este invalidă.');
        }
      },
    },
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: env.NEXTAUTH_JWT_SECRET,
  },
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt({ token, user }) {
      if (!user) {
        return token;
      }

      token.privateKey = user.privateKey;
      token.publicKey = user.publicKey;
      return token;
    },
    session({ session, token }) {
      session.user = {
        privateKey: token.privateKey,
        publicKey: token.publicKey,
      };
      return session;
    },
  },
};

export const getServerAuthSession = (ctx: { req: GetServerSidePropsContext['req']; res: GetServerSidePropsContext['res'] }) => {
  return getServerSession(ctx.req, ctx.res, nextAuthOptions);
};
