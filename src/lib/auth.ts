import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthOptions = {
  session: { strategy: "jwt" },
  debug: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        await prisma.profile.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: { email: user.email, name: user.name ?? null, image: user.image ?? null },
        });
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = (token as any).provider;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};


