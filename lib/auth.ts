import { prisma } from "@/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
  },
  session: {
    //expiresIn: 60 * 60 * 24 * 7, // 7 days
    //updateAge: 60 * 60 * 24, // 1 day
    expiresIn: 60 * 3, // 3 Minutes
    updateAge: 60 * 1, // 1 Minute
  },
  /* GithubProvider({
              clientId: process.env.GITHUB_ID as string,
              clientSecret: process.env.GITHUB_SECRET as string
          }),
          MicrosoftEntraID({
              clientId: process.env.AZURE_AD_CLIENT_ID as string,
              clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
              tenantId: process.env.AZURE_AD_TENANT_ID as string,  
          })*/
});

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/*
export getServerSession()
{
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session
}
*/
