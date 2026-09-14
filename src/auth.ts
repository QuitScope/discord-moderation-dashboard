import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { emptyPermissions } from '@/lib/permission-constants';

export const DEMO_USER = {
  id: 'demo-admin',
  name: 'Demo Admin',
  email: null,
  image: null,
};

export const DEMO_DISCORD_ID = 'demo-discord-000000000000';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Demo-Login',
      credentials: {},
      async authorize() {
        return DEMO_USER;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.userId = token.userId as string;
      session.discordId = DEMO_DISCORD_ID;
      session.discordRoleIds = [];
      session.isGuildAdmin = true;
      session.permissions = emptyPermissions();
      return session;
    },
  },
});
