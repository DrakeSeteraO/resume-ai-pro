import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { id: string; label: string };

export function Stepper({
  steps,
  currentIndex,
  done,
}: {
  steps: Step[];
  currentIndex: number;
  done: boolean;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => {
        const isDone = done || i < currentIndex;
        const isActive = !done && i === currentIndex;
        return (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                isDone && "border-primary bg-primary text-primary-foreground",
                isActive && "border-primary text-primary",
                !isDone && !isActive && "border-border text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                isActive ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}