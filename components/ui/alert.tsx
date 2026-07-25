import { cn } from "@/lib/utils";

export function ErrorAlert({
  title = "Something went wrong",
  message,
  className,
}: {
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
        className
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-red-700/90">{message}</p>
    </div>
  );
}
