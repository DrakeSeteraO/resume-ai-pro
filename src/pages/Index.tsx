import { useEffect, useRef, useState } from "react";
import {
  Coffee,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { emptyProfile, sampleProfile, type ProfileData } from "@/lib/resume-types";
import { generateLatex } from "@/lib/latex-generator";
import { SelectPortal } from "@radix-ui/react-select";

export default function Index() {
  const [data, setData] = useState<ProfileData>(sampleProfile);
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [latex, setLatex] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const update = (updater: (d: ProfileData) => ProfileData) => setData((d) => updater(d));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    let name = data.personal.fullName;
    name = name.replaceAll(" ", "-");
    triggerDownload(blob, name + "-resume-profile.json");
    toast.success("Profile exported as JSON");
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        setData({ ...emptyProfile, ...parsed });
        toast.success("Profile imported");
      } else {
        toast.error("Use JSON for full round-trip.");
      }
    } catch {
      toast.error("Could not parse file — check the format.");
    }
  };

 const runPipeline = async () => {
    setPhase("running");
    
    try {
      // ------------------------------------------------
      // Phase 1: Tailor the Resume Content
      // ------------------------------------------------
      setStepIndex(0); 
      const tailorResponse = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!tailorResponse.ok) {
        // Safe parsing: If the server returns HTML, this prevents the "Token T" crash
        let errorMessage = `Server returned status: ${tailorResponse.status}`;
        try {
          const errorData = await tailorResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Ignored: Server didn't return JSON
        }
        throw new Error(errorMessage);
      }

      setStepIndex(1);
      const tailoredData = await tailorResponse.json();
      setData(tailoredData);

      // ------------------------------------------------
      // Phase 2: Generate the LaTeX Code
      // ------------------------------------------------
      setStepIndex(2);
      const latexResponse = await fetch("/api/latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tailoredData),
      });

      if (!latexResponse.ok) {
        let errorMessage = `Server returned status: ${latexResponse.status}`;
        try {
          const errorData = await latexResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Ignored
        }
        throw new Error(errorMessage);
      }

      const latexData = await latexResponse.json();
      setLatex(latexData.latex); 
      
      setPhase("done");
      toast.success("Resume optimized and LaTeX generated!");
      
    } catch (error) {
      console.error("AI Pipeline Error:", error);
      toast.error(`Pipeline Error: ${error instanceof Error ? error.message : "Check console"}`);
      setPhase("idle");
    }
  };

  console.log("Current ProfileData Structure:", data);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-serif-display text-[24px] font-medium tracking-tight">
              Resumeforge
            </span>
            <span className="ml-1 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setData(sampleProfile)}>
              Load sample
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setData(emptyProfile)}>
              Clear
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Buy me a coffee"
                  className="text-primary hover:text-primary/90"
                >
                  <Coffee className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif-display text-xl">Buy me a coffee</DialogTitle>
                  <DialogDescription>
                    Enjoying Resumeforge? It's built and maintained by one person. If it's saved you
                    time, consider buying me a coffee — it keeps the project caffeinated and
                    ad-free.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                  <Button asChild>
                    <a
                      href="https://buymeacoffee.com/DrakeSetera"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Coffee className="h-4 w-4" /> Donate
                    </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:grid lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col border-r">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Data portability</span>
              <span>· client-side, never uploaded</span>
            </div>
            <div className="flex gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFile(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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

        <section className="min-h-0 overflow-hidden bg-muted/20">
          <OutputPanel phase={phase} stepIndex={stepIndex} latex={latex} profile={data} />
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
