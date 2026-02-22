import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  trustHost: true,

  session: {
    strategy: "jwt", // ← required when using Credentials
  },
  logger: {
    error(error) {
      console.log(typeof error);
      console.error(error); // check your terminal, not the browser
      console.error(error.cause); // check your terminal, not the browser
    },
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) {
          return null;
        }

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.name = user.name as string;
        token.first_auth = user.first_auth;
      }
      if (trigger === "update" && session) {
        // Use `session` here, not `user` (user is undefined on update)
        token.id = session.user?.id || token.id;
        token.name = session.user?.name || token.name;
        token.first_auth = session.user?.first_auth ?? token.first_auth;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.first_auth = token.first_auth as boolean;
      }
      return session;
    },
  },
});
