import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: string | null;
  className?: string;
}

export default function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={cn("text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200", className)}>
      {error}
    </div>
  );
}
