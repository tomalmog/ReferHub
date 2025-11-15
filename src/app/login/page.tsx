"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const cb = params.get("callbackUrl") || "/listings";
      router.replace(cb);
    }
  }, [status, params, router]);
  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-muted-foreground">Choose a provider to continue.</p>
      {error ? (
        <p className="mt-4 text-sm text-red-600">{decodeURIComponent(error)}</p>
      ) : null}
      <div className="mt-8 space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn("google", { callbackUrl: "/listings" })}
        >
          Continue with Google
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={() => signIn("github", { callbackUrl: "/listings" })}
        >
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}


