"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="fr-card flex w-full max-w-md flex-col items-center gap-4 p-10 text-center">
        <AlertTriangle className="h-8 w-8 text-zinc-600" aria-hidden="true" />
        <h1 className="text-lg font-medium text-zinc-100">Something went wrong</h1>
        <p className="text-sm text-zinc-400">{error.message}</p>
        <Button className="fr-cta-btn border-0" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}