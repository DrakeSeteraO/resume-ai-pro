export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  details: string;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string;
};

export type Project = {
  id: string;
  name: string;
  stack: string;
  link: string;
  description: string;
};

export type Certificate = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
};

export type Publication = {
  id: string;
  title: string;
  venue: string;
  date: string;
  link: string;
  description: string;
};

export type ProfileData = {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  narrative: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  certificates: Certificate[];
  publications: Publication[];
  target: {
    company: string;
    role: string;
    jobDescription: string;
  };
};

export const emptyProfile: ProfileData = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
  },
  narrative: "",
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certificates: [],
  publications: [],
  target: { company: "", role: "", jobDescription: "" },
};

export const sampleProfile: ProfileData = {
  personal: {
    fullName: "Alex Morgan",
    email: "alex@morgan.dev",
    phone: "+1 415 555 0142",
    location: "San Francisco, CA",
    website: "alexmorgan.dev",
  },
  narrative:
    "Senior product engineer with 7 years building developer tooling and AI infrastructure. Recently led the migration of a multi-tenant analytics platform from monolith to event-driven services.",
  education: [
    {
      id: "e1",
      school: "University of Michigan",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2014",
      endDate: "2018",
      details: "Graduated with honors. Focus on distributed systems.",
    },
  ],
  experience: [
    {
      id: "x1",
      company: "Linear",
      role: "Senior Software Engineer",
      location: "Remote",
      startDate: "2022",
      endDate: "Present",
      bullets:
        "Led the realtime sync rewrite, reducing p95 latency by 62%.\nMentored 4 engineers across two product pods.\nShipped the public API used by 18k workspaces.",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Pico Inference",
      stack: "Rust, WebGPU, TypeScript",
      link: "github.com/alex/pico",
      description: "Open-source on-device LLM runtime, 4.2k stars.",
    },
  ],
  skills: ["TypeScript", "Rust", "PostgreSQL", "Kubernetes", "React", "System Design"],
  target: { company: "", role: "", jobDescription: "" },
};

export const uid = () => Math.random().toString(36).slice(2, 10);