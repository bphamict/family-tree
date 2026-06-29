import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupabaseStatus } from "@/components/shared/supabase-status";
import { getUser } from "@/lib/auth/get-user";
import { checkSupabaseHealth } from "@/lib/supabase/health";

export default async function Home() {
  const [supabaseHealth, user] = await Promise.all([
    checkSupabaseHealth(),
    getUser(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Family Tree Management System
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Preserve, manage, and visualize your family genealogy. Collaborate
            securely with role-based access across multiple families.
          </p>
          {user ? (
            <Button asChild className="w-fit">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project status</CardTitle>
              <CardDescription>
              Phase 8 — documents and media archive are available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupabaseStatus health={supabaseHealth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting started</CardTitle>
              <CardDescription>
                Create an account to begin managing your family tree.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-sm">
                <li>
                  Copy <code className="text-foreground">.env.example</code> to{" "}
                  <code className="text-foreground">.env.local</code>
                </li>
                <li>
                  Run <code className="text-foreground">pnpm db:start</code> to
                  start Supabase locally
                </li>
                <li>
                  <Link href="/register" className="text-foreground hover:underline">
                    Create an account
                  </Link>{" "}
                  or{" "}
                  <Link href="/login" className="text-foreground hover:underline">
                    sign in
                  </Link>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
