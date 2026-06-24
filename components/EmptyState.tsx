import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  message: string;
};

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="fr-card flex flex-col items-center justify-center gap-3 p-10 text-center">
      <Icon className="h-8 w-8 text-zinc-600" aria-hidden="true" />
      <p className="max-w-sm text-sm text-zinc-400">{message}</p>
    </div>
  );
}