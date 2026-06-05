import { useEffect, useRef, useState } from "react";
import {
  Coffee,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Moon,
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { emptyProfile, sampleProfile, type ProfileData } from "@/lib/resume-types";
import { generateLatex } from "@/lib/latex-generator";
import { SelectPortal } from "@radix-ui/react-select";

export default function Index() {
  const [data, setData] = useState<ProfileData>(emptyProfile);
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [latex, setLatex] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
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

  const compilePdfWithRetry = async (latexString: string, maxRetries = 5): Promise<Blob> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call YOUR Vercel backend proxy route
        const response = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latex_string: latexString }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        // Success! Return the raw PDF binary data
        return await response.blob();
      } catch (error) {
        console.warn(`PDF compilation attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new Error("PDF compilation failed. The server might be overloaded.");
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw new Error("Compilation failed.");
  };


  const fetchJsonWithRetry = async (url: string, options: RequestInit, maxRetries = 1) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          let errorMessage = `Server returned status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {
            // Ignored if server doesn't return JSON
          }
          throw new Error(errorMessage);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.warn(`⚠️ Stage error on ${url}. Retrying attempt ${attempt + 1}/${maxRetries}...`);
          // Wait 1.5 seconds before retrying to give the API breathing room
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
    // If we exit the loop, all retries failed. Throw the final error.
    throw lastError;
  };


  const runPipeline = async () => {
    setPhase("running");
    setStepIndex(0);

    try {
      // ------------------------------------------------
      // Step 1: Rewriting for maximum impact
      // ------------------------------------------------
      setStepIndex(0);
      const tailoredData = await fetchJsonWithRetry("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, 1); // 1 retry allowed
      
      console.log("✅ Stage 1 - Tailored Profile Data:", tailoredData);

      // ------------------------------------------------
      // Step 2: Structuring initial document
      // ------------------------------------------------
      setStepIndex(1);
      const latexData = await fetchJsonWithRetry("/api/latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tailoredData),
      }, 1);
      
      console.log("✅ Stage 2 - Initial LaTeX Code:", latexData);

      // ------------------------------------------------
      // Step 3: Critiquing alignment & layout
      // ------------------------------------------------
      setStepIndex(2);
      const critiqueData = await fetchJsonWithRetry("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: tailoredData,
          latex_string: latexData.latex,
        }),
      }, 1);
      
      console.log("✅ Stage 3 - Critique & Improvements:", critiqueData);

      // ------------------------------------------------
      // Step 4: Generate the LaTeX Code
      // ------------------------------------------------
      setStepIndex(3);
      const finalLatexData = await fetchJsonWithRetry("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: tailoredData,
          latex_string: latexData.latex,
          improvements: critiqueData.improvements,
        }),
      }, 1);
      
      setLatex(finalLatexData.latex);
      console.log("✅ Stage 4 - Final Revised LaTeX:", finalLatexData);

      // ------------------------------------------------
      // Step 5: Compiling downloadable PDF
      // ------------------------------------------------
      setStepIndex(4);
      setPdfError(null);
      try {
        // Kept your existing retry logic here since compilePdfWithRetry already manages blobs
        const pdfBlob = await compilePdfWithRetry(finalLatexData.latex, 5); 
        console.log(`✅ Stage 5 - PDF Compilation Successful (Size: ${pdfBlob.size} bytes)`);
        
        const localPdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(localPdfUrl);
        setPhase("done");
        toast.success("Resume optimized and LaTeX generated!");
      } catch (pdfErr) {
        const message = pdfErr instanceof Error ? pdfErr.message : "PDF compilation failed.";
        console.error("❌ PDF compilation failed:", pdfErr);
        setPdfError(message);
        setPhase("done");
        toast.error(`PDF compile failed: ${message}`);
      }
      
    } catch (error) {
      // If any stage fails its initial attempt AND its retry, it gets caught right here
      console.error("❌ AI Pipeline Error:", error);
      toast.error(`Pipeline Error: ${error instanceof Error ? error.message : "Check console"}`);
      setPhase("idle");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-serif-title text-3xl font-semibold tracking-tight">
              UltraCV
            </span>
            <span className="ml-1 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
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
                    Enjoying UltraCV? It's built and maintained by one person. If it's saved you
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

      <main className="flex flex-col lg:h-[calc(100vh-4rem)]">
        <div className="hidden h-full lg:block">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={50} minSize={25}>
            <LeftPane
              data={data}
              update={update}
              fileRef={fileRef}
              importFile={importFile}
              exportJson={exportJson}
              runPipeline={runPipeline}
              phase={phase}
              setData={setData}
            />
          </ResizablePanel>
          <ResizableHandle className="w-1.5 bg-border/60 hover:bg-primary/40 transition-colors" />
          <ResizablePanel defaultSize={50} minSize={25}>
            <section className="h-full min-h-0 overflow-hidden bg-muted/20">
              <OutputPanel
                phase={phase}
                stepIndex={stepIndex}
                latex={latex}
                profile={data}
                pdfError={pdfError}
                pdfUrl={pdfUrl}
              />
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>

        <div className="flex flex-col lg:hidden">
          <LeftPane
            data={data}
            update={update}
            fileRef={fileRef}
            importFile={importFile}
            exportJson={exportJson}
            runPipeline={runPipeline}
            phase={phase}
            setData={setData}
          />
          <section className="min-h-[60vh] overflow-hidden bg-muted/20">
            <OutputPanel
              phase={phase}
              stepIndex={stepIndex}
              latex={latex}
              profile={data}
              pdfError={pdfError}
              pdfUrl={pdfUrl}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function LeftPane({
  data,
  update,
  fileRef,
  importFile,
  exportJson,
  runPipeline,
  phase,
  setData,
}: {
  data: ProfileData;
  update: (updater: (d: ProfileData) => ProfileData) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  importFile: (f: File) => void;
  exportJson: () => void;
  runPipeline: () => void;
  phase: PipelinePhase;
  setData: (d: ProfileData) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r">
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
