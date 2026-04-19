import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Plane } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="max-w-5xl mx-auto flex justify-between items-center h-full px-5">
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

      <section className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Your flight log, reimagined.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Track every flight, visualize your routes on a world map, and own
          your travel data.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <footer className="w-full border-t py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Supabase, and ☕
      </footer>
    </main>
  );
}