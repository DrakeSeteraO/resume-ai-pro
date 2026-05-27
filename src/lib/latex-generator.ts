import type { ProfileData } from "./resume-types";

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

export function generateLatex(p: ProfileData): string {
  const keywords = extractKeywords(p.target.jobDescription);
  const skills = dedupe([...p.skills, ...keywords]).slice(0, 18);

  const header = `% Tailored for ${p.target.company || "—"} · ${p.target.role || "—"}
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\setlist[itemize]{leftmargin=*,nosep,topsep=2pt}
\\pagestyle{empty}
\\begin{document}
`;

  const name = `\\begin{center}\n{\\Huge \\textbf{${esc(p.personal.fullName || "Your Name")}}}\\\\[4pt]\n${[p.personal.email, p.personal.phone, p.personal.location, p.personal.website]
    .filter(Boolean)
    .map(esc)
    .join(" \\quad\\textbar\\quad ")}\n\\end{center}\n`;

  const summary = p.narrative.trim()
    ? `\\section*{Summary}\n${esc(p.narrative.trim())}\n`
    : "";

  const exp = p.experience.length
    ? `\\section*{Experience}\n${p.experience
        .map(
          (e) => `\\textbf{${esc(e.role)}} \\hfill ${esc(e.startDate)} -- ${esc(e.endDate)}\\\\\n\\textit{${esc(e.company)}${e.location ? `, ${esc(e.location)}` : ""}}\n\\begin{itemize}\n${e.bullets
            .split(/\n+/)
            .filter(Boolean)
            .map((b) => `  \\item ${esc(b)}`)
            .join("\n")}\n\\end{itemize}\n`,
        )
        .join("\n")}`
    : "";

  const edu = p.education.length
    ? `\\section*{Education}\n${p.education
        .map(
          (e) => `\\textbf{${esc(e.school)}} \\hfill ${esc(e.startDate)} -- ${esc(e.endDate)}\\\\\n${esc(e.degree)} in ${esc(e.field)}${e.details ? `. ${esc(e.details)}` : ""}\n`,
        )
        .join("\n\\vspace{4pt}\n")}`
    : "";

  const proj = p.projects.length
    ? `\\section*{Projects}\n${p.projects
        .map(
          (pr) => `\\textbf{${esc(pr.name)}} \\textit{${esc(pr.stack)}}${pr.link ? ` \\hfill \\href{https://${esc(pr.link)}}{${esc(pr.link)}}` : ""}\\\\\n${esc(pr.description)}\n`,
        )
        .join("\n\\vspace{4pt}\n")}`
    : "";

  const sk = skills.length
    ? `\\section*{Skills}\n${skills.map(esc).join(" \\textbullet{} ")}\n`
    : "";

  return `${header}${name}${summary}${exp}${edu}${proj}${sk}\\end{document}\n`;
}

function extractKeywords(jd: string): string[] {
  if (!jd) return [];
  const tokens = jd
    .toLowerCase()
    .match(/[a-z][a-z+#.]{2,}/g) ?? [];
  const stop = new Set([
    "and","the","for","with","you","our","are","will","that","this","have","work","team","role","from","into","using","build","across","strong","plus","etc","experience","years","year","ability","including","such",
  ]);
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (stop.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t[0].toUpperCase() + t.slice(1));
}

const dedupe = (a: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of a) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
};