import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fr-page flex min-h-full items-center justify-center p-6">
      <div className="fr-card flex w-full max-w-md flex-col items-center gap-4 p-10 text-center">
        <FileQuestion className="h-8 w-8 text-zinc-600" aria-hidden="true" />
        <h1 className="text-lg font-medium text-zinc-100">Page not found</h1>
        <p className="text-sm text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/overview" className="fr-cta-btn px-4 py-2 text-sm">
          Go to overview
        </Link>
      </div>
    </div>
  );
}