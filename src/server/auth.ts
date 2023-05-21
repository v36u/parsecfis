import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { createPublicKey } from 'crypto';
import { type GetServerSidePropsContext } from 'next';
import { getServerSession, type DefaultSession, type NextAuthOptions, type User } from 'next-auth';
import { env } from '~/env.mjs';
import { prisma } from '~/server/db';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      publicKey: string;
    };
  }

  interface User {
    publicKey: string;
  }

  interface Profile {
    publicKey: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    publicKey: string;
  }
}

export const authOptions: NextAuthOptions = {
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

        try {
          const publicKey = createPublicKey({
            key: credentials.privateKey,
            type: 'spki',
            format: 'pem',
          })
            .export({
              type: 'spki',
              format: 'der',
            })
            .toString('hex');

          const user = await prisma.user.upsert({
            where: {
              publicKey,
            },
            update: {
              lastLoggedInAt: new Date(),
            },
            create: {
              publicKey,
            },
          });

          const authenticatedUser: User = {
            id: user.id.toString(),
            publicKey,
          };

          return authenticatedUser;
        } catch (_) {
          throw new Error('Cheia privată nu este validă.');
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

      token.publicKey = user.publicKey;
      return token;
    },
    session({ session, token }) {
      session.user.publicKey = token.publicKey;
      return session;
    },
  },
};

export const getServerAuthSession = (ctx: { req: GetServerSidePropsContext['req']; res: GetServerSidePropsContext['res'] }) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
