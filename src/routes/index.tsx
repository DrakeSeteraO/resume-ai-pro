import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Moon,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Target,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ProfileEditor } from "@/components/resume/ProfileEditor";
import { JobTarget } from "@/components/resume/JobTarget";
import { OutputPanel, type PipelinePhase } from "@/components/resume/OutputPanel";
import {
  emptyProfile,
  sampleProfile,
  type ProfileData,
} from "@/lib/resume-types";
import { generateLatex } from "@/lib/latex-generator";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Resumeforge — AI Resume Optimizer & LaTeX Builder" },
      {
        name: "description",
        content:
          "Tailor your resume to any role with an AI optimizer that produces ATS-friendly LaTeX and compiled PDFs.",
      },
    ],
  }),
});

function Index() {
  const [data, setData] = useState<ProfileData>(sampleProfile);
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [latex, setLatex] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const update = (updater: (d: ProfileData) => ProfileData) =>
    setData((d) => updater(d));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, "resume-profile.json");
    toast.success("Profile exported as JSON");
  };

  const exportCsv = () => {
    const rows: string[][] = [["section", "field", "value"]];
    Object.entries(data.personal).forEach(([k, v]) =>
      rows.push(["personal", k, v]),
    );
    rows.push(["narrative", "text", data.narrative]);
    data.experience.forEach((e, i) =>
      Object.entries(e).forEach(([k, v]) =>
        rows.push([`experience[${i}]`, k, String(v)]),
      ),
    );
    data.education.forEach((e, i) =>
      Object.entries(e).forEach(([k, v]) =>
        rows.push([`education[${i}]`, k, String(v)]),
      ),
    );
    data.projects.forEach((p, i) =>
      Object.entries(p).forEach(([k, v]) =>
        rows.push([`projects[${i}]`, k, String(v)]),
      ),
    );
    rows.push(["skills", "list", data.skills.join("|")]);
    Object.entries(data.target).forEach(([k, v]) =>
      rows.push(["target", k, v]),
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    triggerDownload(new Blob([csv], { type: "text/csv" }), "resume-profile.csv");
    toast.success("Profile exported as CSV");
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        setData({ ...emptyProfile, ...parsed });
        toast.success("Profile imported");
      } else {
        toast.error("Use JSON for full round-trip. CSV import coming soon.");
      }
    } catch (e) {
      toast.error("Could not parse file — check the format.");
    }
  };

  const runPipeline = async () => {
    setPhase("running");
    for (let i = 0; i < 3; i++) {
      setStepIndex(i);
      // simulate dual-endpoint backend latency
      await new Promise((r) => setTimeout(r, i === 2 ? 1400 : 900));
    }
    setLatex(generateLatex(data));
    setPhase("done");
    toast.success("Resume tailored and LaTeX generated");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" />

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif-display text-[17px] font-medium tracking-tight">
              Resumeforge
            </span>
            <span className="ml-1 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setData(sampleProfile)}
            >
              Load sample
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setData(emptyProfile)}
            >
              Clear
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT: Workspace */}
        <section className="flex min-h-0 flex-col border-r">
          {/* Data portability toolbar */}
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Data portability
              </span>
              <span>· client-side, never uploaded</span>
            </div>
            <div className="flex gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Import
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={exportJson}>
                    <FileJson className="h-4 w-4" /> Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportCsv}>
                    <FileSpreadsheet className="h-4 w-4" /> Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Tabs defaultValue="profile" className="flex h-full flex-col">
              <div className="sticky top-0 z-10 border-b bg-background px-5 pt-4">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="profile" className="gap-2">
                    <UserRound className="h-3.5 w-3.5" /> Profile
                  </TabsTrigger>
                  <TabsTrigger value="job" className="gap-2">
                    <Target className="h-3.5 w-3.5" /> Job target
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="profile" className="m-0 px-5 py-5">
                <ProfileEditor data={data} setData={update} />
              </TabsContent>
              <TabsContent value="job" className="m-0 px-5 py-5">
                <JobTarget data={data} setData={update} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Generate action */}
          <div className="border-t bg-card/60 p-4 backdrop-blur">
            <Button
              size="lg"
              className="w-full gap-2 text-sm font-semibold shadow-elevated"
              onClick={runPipeline}
              disabled={phase === "running"}
            >
              <Wand2 className="h-4 w-4" />
              {phase === "running"
                ? "Optimizing…"
                : phase === "done"
                  ? "Regenerate LaTeX resume"
                  : "Optimize & generate LaTeX resume"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Runs a dual-endpoint pipeline: parse → structure → tailor.
            </p>
          </div>
        </section>

        {/* RIGHT: Output */}
        <section className="min-h-0 overflow-hidden bg-muted/20">
          <OutputPanel
            phase={phase}
            stepIndex={stepIndex}
            latex={latex}
            profile={data}
          />
        </section>
      </main>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
