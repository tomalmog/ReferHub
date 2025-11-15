"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
      <p className="mt-2 text-muted-foreground">Create your account to start exchanging referrals.</p>
      <div className="mt-8 space-y-3">
        <Button className="w-full" size="lg" onClick={() => signIn("google", { callbackUrl: "/listings" })}>Continue with Google</Button>
        <Button className="w-full" size="lg" variant="secondary" onClick={() => signIn("github", { callbackUrl: "/listings" })}>Continue with GitHub</Button>
      </div>
    </div>
  );
}


