import { Briefcase, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileData } from "@/lib/resume-types";

export function JobTarget({
  data,
  setData,
}: {
  data: ProfileData;
  setData: (updater: (d: ProfileData) => ProfileData) => void;
}) {
  const t = data.target;
  const wordCount = t.jobDescription.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 transition-colors hover:border-foreground/15">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Target role & company</h3>
            <p className="text-xs text-muted-foreground">
              The optimizer will tailor every section to this target.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Target company name
            </Label>
            <Input
              value={t.company}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  target: { ...d.target, company: e.target.value },
                }))
              }
              placeholder="e.g. Stripe"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Target job title
            </Label>
            <Input
              value={t.role}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  target: { ...d.target, role: e.target.value },
                }))
              }
              placeholder="e.g. Senior Product Engineer"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 transition-colors hover:border-foreground/15">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Job description</Label>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {wordCount} words
          </span>
        </div>
        <Textarea
          value={t.jobDescription}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              target: { ...d.target, jobDescription: e.target.value },
            }))
          }
          placeholder="Paste the full listing here — responsibilities, requirements, nice-to-haves. The more detail, the sharper the tailoring."
          className="min-h-72 resize-none font-mono text-xs leading-relaxed"
        />
      </div>
    </div>
  );
}