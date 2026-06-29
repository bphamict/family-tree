import Link from "next/link";
import { TreePine } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <TreePine className="size-5" aria-hidden="true" />
            <span className="font-semibold">Family Tree</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
