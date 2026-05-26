"use client";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { provisionOrg } from "@/server/actions/org";

export function OrgBootstrap() {
  const { setActive } = useClerk();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    provisionOrg()
      .then((orgId) => setActive({ organization: orgId }))
      .then(() => router.refresh())
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to set up workspace"
        )
      );
  }, [setActive, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-slate-500">Setting up your workspace...</p>
    </div>
  );
}
