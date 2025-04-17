"use client"

import { signIn } from "@/lib/auth-client";
import { Button } from "./ui/button";

export const signInGitHub = async () => {
  const data = await signIn.social({
      provider: "github",
      callbackURL: "/private"
  });
  return data;
};

export function SignInButton() {
    return (<Button onClick={signInGitHub}>Please Login</Button>)
}