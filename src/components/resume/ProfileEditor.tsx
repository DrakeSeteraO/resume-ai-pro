import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ProfileData } from "@/lib/resume-types";
import { uid } from "@/lib/resume-types";
import { useState } from "react";

type Props = {
  data: ProfileData;
  setData: (updater: (d: ProfileData) => ProfileData) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:border-foreground/15">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function ProfileEditor({ data, setData }: Props) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setData((d) => ({
      ...d,
      skills: Array.from(new Set([...d.skills, ...parts])),
    }));
    setSkillInput("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="font-serif-display text-lg font-medium tracking-tight">
          Tell the AI about your history
        </Label>
        <p className="text-xs text-muted-foreground">
          Casually dump paragraphs about your background, projects, or day-to-day duties. The optimizer will structure it.
        </p>
        <Textarea
          value={data.narrative}
          onChange={(e) =>
            setData((d) => ({ ...d, narrative: e.target.value }))
          }
          placeholder="I'm a backend engineer who's spent the last 4 years at fintech startups. Most recently I rebuilt our payments ledger to handle 10x volume using Go and Postgres..."
          className="min-h-32 resize-none font-sans text-sm leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name">
          <Input
            value={data.personal.fullName}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                personal: { ...d.personal, fullName: e.target.value },
              }))
            }
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email">
          <Input
            value={data.personal.email}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                personal: { ...d.personal, email: e.target.value },
              }))
            }
            placeholder="jane@doe.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={data.personal.phone}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                personal: { ...d.personal, phone: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Location">
          <Input
            value={data.personal.location}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                personal: { ...d.personal, location: e.target.value },
              }))
            }
          />
        </Field>
        <div className="col-span-2">
          <Field label="Website / Portfolio">
            <Input
              value={data.personal.website}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  personal: { ...d.personal, website: e.target.value },
                }))
              }
              placeholder="jane.dev"
            />
          </Field>
        </div>
      </div>

      <Tabs defaultValue="experience" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="experience">Work</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="experience" className="mt-4 space-y-3">
          {data.experience.map((e, i) => (
            <SectionCard
              key={e.id}
              title={`Role ${i + 1}`}
              onRemove={() =>
                setData((d) => ({
                  ...d,
                  experience: d.experience.filter((x) => x.id !== e.id),
                }))
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Role">
                  <Input
                    value={e.role}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x) =>
                          x.id === e.id ? { ...x, role: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Company">
                  <Input
                    value={e.company}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x) =>
                          x.id === e.id ? { ...x, company: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Start">
                  <Input
                    value={e.startDate}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x) =>
                          x.id === e.id ? { ...x, startDate: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="End">
                  <Input
                    value={e.endDate}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        experience: d.experience.map((x) =>
                          x.id === e.id ? { ...x, endDate: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Achievements (one per line)">
                <Textarea
                  value={e.bullets}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      experience: d.experience.map((x) =>
                        x.id === e.id ? { ...x, bullets: ev.target.value } : x,
                      ),
                    }))
                  }
                  className="min-h-24 resize-none text-sm"
                />
              </Field>
            </SectionCard>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() =>
              setData((d) => ({
                ...d,
                experience: [
                  ...d.experience,
                  {
                    id: uid(),
                    company: "",
                    role: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    bullets: "",
                  },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add role
          </Button>
        </TabsContent>

        <TabsContent value="education" className="mt-4 space-y-3">
          {data.education.map((e, i) => (
            <SectionCard
              key={e.id}
              title={`Education ${i + 1}`}
              onRemove={() =>
                setData((d) => ({
                  ...d,
                  education: d.education.filter((x) => x.id !== e.id),
                }))
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="School">
                  <Input
                    value={e.school}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        education: d.education.map((x) =>
                          x.id === e.id ? { ...x, school: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Degree">
                  <Input
                    value={e.degree}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        education: d.education.map((x) =>
                          x.id === e.id ? { ...x, degree: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Field">
                  <Input
                    value={e.field}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        education: d.education.map((x) =>
                          x.id === e.id ? { ...x, field: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start">
                    <Input
                      value={e.startDate}
                      onChange={(ev) =>
                        setData((d) => ({
                          ...d,
                          education: d.education.map((x) =>
                            x.id === e.id
                              ? { ...x, startDate: ev.target.value }
                              : x,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="End">
                    <Input
                      value={e.endDate}
                      onChange={(ev) =>
                        setData((d) => ({
                          ...d,
                          education: d.education.map((x) =>
                            x.id === e.id
                              ? { ...x, endDate: ev.target.value }
                              : x,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
              <Field label="Notes">
                <Input
                  value={e.details}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      education: d.education.map((x) =>
                        x.id === e.id ? { ...x, details: ev.target.value } : x,
                      ),
                    }))
                  }
                />
              </Field>
            </SectionCard>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() =>
              setData((d) => ({
                ...d,
                education: [
                  ...d.education,
                  {
                    id: uid(),
                    school: "",
                    degree: "",
                    field: "",
                    startDate: "",
                    endDate: "",
                    details: "",
                  },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add education
          </Button>
        </TabsContent>

        <TabsContent value="projects" className="mt-4 space-y-3">
          {data.projects.map((p, i) => (
            <SectionCard
              key={p.id}
              title={`Project ${i + 1}`}
              onRemove={() =>
                setData((d) => ({
                  ...d,
                  projects: d.projects.filter((x) => x.id !== p.id),
                }))
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input
                    value={p.name}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        projects: d.projects.map((x) =>
                          x.id === p.id ? { ...x, name: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Stack">
                  <Input
                    value={p.stack}
                    onChange={(ev) =>
                      setData((d) => ({
                        ...d,
                        projects: d.projects.map((x) =>
                          x.id === p.id ? { ...x, stack: ev.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Link">
                <Input
                  value={p.link}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      projects: d.projects.map((x) =>
                        x.id === p.id ? { ...x, link: ev.target.value } : x,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={p.description}
                  onChange={(ev) =>
                    setData((d) => ({
                      ...d,
                      projects: d.projects.map((x) =>
                        x.id === p.id
                          ? { ...x, description: ev.target.value }
                          : x,
                      ),
                    }))
                  }
                  className="min-h-20 resize-none text-sm"
                />
              </Field>
            </SectionCard>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() =>
              setData((d) => ({
                ...d,
                projects: [
                  ...d.projects,
                  { id: uid(), name: "", stack: "", link: "", description: "" },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add project
          </Button>
        </TabsContent>

        <TabsContent value="skills" className="mt-4 space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {data.skills.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No skills yet — add a few or paste a comma-separated list.
                </span>
              )}
              {data.skills.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="gap-1 rounded-md px-2 py-1 text-xs font-medium"
                >
                  {s}
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        skills: d.skills.filter((k) => k !== s),
                      }))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="React, TypeScript, Postgres..."
              />
              <Button variant="outline" onClick={() => addSkill(skillInput)}>
                Add
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}