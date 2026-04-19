import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { Plane } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="h-16 w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5" />
            Wingman
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        {children}
      </div>

      <footer className="w-full border-t py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Supabase, and ☕
      </footer>
    </main>
  );
}
