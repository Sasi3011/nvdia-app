"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "../components/ui/Spinner";
import { useSession } from "../lib/session";

export default function Home() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.isLoading) return;
    if (!session.data?.authenticated) {
      router.replace("/login");
    } else if (!session.data.onboarded) {
      router.replace("/onboarding");
    } else {
      const roles = session.data.roles ?? [];
      if (roles.includes("ADMIN")) {
        router.replace("/admin");
      } else if (roles.includes("MENTOR")) {
        router.replace("/mentor");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [session.isLoading, session.data, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
