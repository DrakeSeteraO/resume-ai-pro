import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stepper } from "./Stepper";
import type { ProfileData } from "@/lib/resume-types";

export type PipelinePhase = "idle" | "running" | "done";

const STEPS = [
  { id: "rewrite", label: "Rewriting for maximum impact..." },
  { id: "structure", label: "Structuring initial document..." },
  { id: "critique", label: "Critiquing alignment & layout..." },
  { id: "optimize", label: "Injecting final optimizations..." },
  { id: "compile", label: "Compiling downloadable PDF..." },
];

export function OutputPanel({
  phase,
  stepIndex,
  latex,
  profile,
}: {
  phase: PipelinePhase;
  stepIndex: number;
  latex: string;
  profile: ProfileData;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (phase === "idle") {
    return (
      <div className="grid-bg flex h-full flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-6">
          <div className="absolute inset-0 -m-3 rounded-2xl bg-primary/10 blur-2xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-elevated">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="font-serif-display text-2xl font-medium tracking-tight">
          Your tailored resume appears here
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Fill out your profile and target role on the left, then run the
          optimizer. The LaTeX source and a downloadable PDF will land in this
          panel.
        </p>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-elevated">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-serif-display text-base font-medium">Optimizing your resume</p>
              <p className="text-xs text-muted-foreground">
                Dual-endpoint pipeline · {stepIndex + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <Stepper steps={STEPS} currentIndex={stepIndex} done={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Check className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="font-serif-display text-base font-medium leading-none">Resume ready</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tailored for {profile.target.role || "your target role"}
              {profile.target.company ? ` @ ${profile.target.company}` : ""}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="code" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-5 pt-3">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="code" className="gap-2">
              <FileCode className="h-3.5 w-3.5" /> Raw LaTeX
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileText className="h-3.5 w-3.5" /> Document
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="code"
          className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              resume.tex
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={copy} className="h-7">
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => download("resume.tex", latex, "text/plain")}
              >
                <Download className="h-3 w-3" /> .tex
              </Button>
            </div>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto bg-card p-5 font-mono text-xs leading-relaxed">
            <SyntaxLatex code={latex} />
          </pre>
        </TabsContent>

        <TabsContent
          value="pdf"
          className="m-0 flex flex-1 flex-col items-center justify-center bg-muted/40 p-8"
        >
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-elevated">
            <div className="mb-5 flex aspect-[8.5/11] w-full items-center justify-center rounded-md border border-dashed bg-muted/30">
              <div className="px-6 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">
                  {profile.personal.fullName || "Your Name"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Single-page · ATS-friendly · LaTeX compiled
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => download("resume.tex", latex, "text/plain")}
            >
              <Download className="h-4 w-4" /> Download compiled PDF
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              PDF compilation runs server-side. The .tex source is bundled in
              the download.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Minimal LaTeX syntax highlighter
function SyntaxLatex({ code }: { code: string }) {
  const parts = code.split(/(\\[a-zA-Z]+\*?|%[^\n]*|\{[^}]*\})/g);
  return (
    <code className="text-foreground">
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith("\\"))
          return (
            <span key={i} className="text-primary">
              {p}
            </span>
          );
        if (p.startsWith("%"))
          return (
            <span key={i} className="text-muted-foreground italic">
              {p}
            </span>
          );
        if (p.startsWith("{") && p.endsWith("}"))
          return (
            <span key={i} className="text-foreground/80">
              {p}
            </span>
          );
        return <span key={i}>{p}</span>;
      })}
    </code>
  );
}