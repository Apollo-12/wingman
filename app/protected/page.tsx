import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function ProtectedContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome aboard, {data.user.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your flight log is ready. Let&apos;s start building.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">No flights yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Soon you&apos;ll be able to import your Flighty CSV or add flights
          manually.
        </p>
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <ProtectedContent />
    </Suspense>
  );
}
