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
    fullName: "Drake Setera",
    email: "dsetera24@gmail.com",
    phone: "(123) 456 - 7890",
    location: "Holly, MI",
    website: "https://www.linkedin.com/in/drake-setera/",
  },
  narrative:
    "I have a passion for low-level programming, systems design, and building computing projects from the ground up. My interests range from building a working one-instruction computer inside Minecraft with its own custom assembly language, compiler, and emulator to making code that hurts the eyes of any developer it comes in contact with.",
  education: [
    {
      id: "e1",
      school: "Holly High School",
      degree: "High School Diploma",
      field: "None",
      startDate: "September 2020",
      endDate: "May 2024",
      details: "National Honor Society, Math and Science Team, Varsity Tennis, Varsity Powerlifting team, and Golf Team",
    },
    {
      id: "e2",
      school: "University of Michigan Flint",
      degree: "None",
      field: "Computer Engineering",
      startDate: "September 2022",
      endDate: "May 2023",
      details: "Grade: 4.0. Learned Intro to Engineering, Computer-Aided Drafting, Introduction to MATLAB, and Introduction to C++ through dual enrollment.",
    },
    {
      id: "e3",
      school: "Oakland Community College",
      degree: "None",
      field: "Computer Science",
      startDate: "September 2023",
      endDate: "July 2025",
      details: "Grade: 3.77. Learned Introduction to Java, Object-Oriented Java, Calculus 2, Calculus 3, Geology, and Statistics at Oakland Community College through dual enrollment and over the summer.",
    },
    {
      id: "e4",
      school: "Grand Valley State University",
      degree: "Bachelor and Minor",
      field: "Computer Science and Matematics",
      startDate: "August 2024",
      endDate: "May 2027",
      details: "Grade: 3.9. Frederik Meijer Honors College Member",
    },
    {
      id: "e5",
      school: "Grand Valley State University",
      degree: "Master's",
      field: "Artificial Intelligence",
      startDate: "August 2024",
      endDate: "May 2028",
      details: "Grade: 3.9. Frederik Meijer Honors College Member",
    },
  ],
  experience: [
    {
      id: "x1",
      company: "Heather Highlands Golf Club",
      role: "Guest Services",
      location: "Holly, Michigan",
      startDate: "June 2022",
      endDate: "August 2023",
      bullets: "Ensured the collection and maintenance of golf balls, Prepared golf carts for customers to operate",
    },
    {
      id: "x2",
      company: "Cranbrook Schools",
      role: "Tennis Instructor",
      location: "Bloomfield Hills, Michigan",
      startDate: "June 2024",
      endDate: "August 2024",
      bullets: "Designed a tennis curriculum to teach the fundamentals of tennis to groups of 20 second through eighth-graders, Ensured a safe and fun environment for children to learn tennis, Collaborated with nearby tennis programs to create non-overlapping schedules for the tennis courts",
    },
    {
      id: "x3",
      company: "Konica Minolta, Inc.",
      role: "Computer Deployment Team Member",
      location: "New Hudson, Michigan",
      startDate: "April 2025",
      endDate: "August 2025",
      bullets: "Assisted in the preparation and packaging of 20,000+ devices for shipment to school districts across the U.S., Independently audited and corrected asset and library tags on 1,000+ iPads to resolve data inconsistencies before distribution",
    },
    {
      id: "x4",
      company: "Oakleypaws",
      role: "Content Creator",
      location: "Remote",
      startDate: "October 2020",
      endDate: "Present",
      bullets: "Create and publish technical content focused on building computing systems in Minecraft Bedrock, Grew channel to 500K+ views on long-form content and 600K+ views on short-form videos, Design engaging videos that explain logic systems and low-level computing concepts, Manage the full content pipeline, including planning, building, recording, editing, and publishing, Built an audience by making complex technical ideas accessible and engaging",
    },
    {
      id: "x5",
      company: "Grand Valley State University",
      role: "CIS Tutor",
      location: "Allendale, Michigan",
      startDate: "January 2025",
      endDate: "Present",
      bullets: "Provide hands-on guidance in programming languages such as Python, Assist students in debugging code and improving coding practices, Mentor students to boost their confidence and help foster a passion for coding",
    },
    {
      id: "x6",
      company: "Grand Valley State University",
      role: "College of Computing Mentor",
      location: "Allendale, Michigan",
      startDate: "August 2025",
      endDate: "Present",
      bullets: "Providing support and guidance to computing students in academic and personal development, Serve as a student ambassador by sharing program opportunities, campus resources, and personal experiences",
    },
    {
      id: "x7",
      company: "Blue Nucleus",
      role: "Junior Developer",
      location: "Allendale, Michigan",
      startDate: "October 2025",
      endDate: "Present",
      bullets: "Contributing to the development of a social media platform, similar to Twitter/Reddit, for use in a cyberbullying honeypot research project, Developing frontend features in React, including post creation, comment threads,  and user profiles, Designing a Firebase database (NoSQL) to handle user accounts, posts, and comments, Implementing a user login system that validates users credentials",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "3D Rendering Engine",
      stack: "Python, Calculus",
      link: "https://github.com/DrakeSeteraO/3d-Render",
      description: "- Utilized Python and Calculus 3 techniques like spherical coordinates to calculate vector locations and accurately model object depth, Optimized computational efficiency by developing efficient rendering algorithms and a file system to store pre-rendered 3d environments",
    },
    {
      id: "p2",
      name: "Memory Sort Algorithm",
      stack: "Python",
      link: "https://github.com/DrakeSeteraO/Memory-Sort",
      description: "Designed the algorithm to utilize computer memory to sort a list of integers in O(n+k) run time, Outperforms Merge sort with a list of 2,000+ elements containing random integers from 0 to 1,000,000, Frequently update and make the algorithm more user-friendly to implement",
    },
    {
      id: "p3",
      name: "Minecraft Computing Systems (Oakleypaws Channel)",
      stack: "YouTube, Davinci Resolve, OBS, Minecraft",
      link: "https://www.youtube.com/@Oakleypaws",
      description: "Design and build functional computing systems in Minecraft, calculators, and learning AI, Implement arithmetic operations, like addition, using in-game mechanics to simulate real computing behavior",
    },
    {
      id: "p4",
      name: "5 Bit Computer Emulator",
      stack: "Python, Custom Assembly",
      link: "https://github.com/DrakeSeteraO/5-Bit-Computer-Emulator",
      description: "Designed and implemented a fully functional 5-bit computer with a custom instruction set architecture (ISA), Developed a custom assembler and compiler using Python to translate custom assembly and high-level pseudo code into machine-executable binary code, Wrote a compiler with full error detection for assembly code, delivering detailed feedback to users on all syntax issues before compilation, Created and maintained a modular codebase of 2,000+ lines across 10+ Python files, ensuring clean architecture, readability, and long-term scalability",
    },
    {
      id: "p5",
      name: "1 Instruction Computer",
      stack: "Java, Python, Custom Assembly, Minecraft",
      link: "https://github.com/DrakeSeteraO/1-Instruction-Computer-for-Minecraft-Bedrock",
      description: "- Designed a Java Compiler that compiles a custom assembly file into a binary file, maximizing space efficiency, and a Java Emulator that simulates the computer's output, Integrated a Python script to convert binary files into Minecraft files that can be easily loaded into the Minecraft computer for user ease of use, Constructed a computer in Minecraft that uses a custom one-instruction architecture to perform operations",
    },
  ],
  skills: ["Java", "Python", "C", "NoSQL (Firebase)", "SQL", "React", "JavaScript", "Firebase"],
  certificates: [
    {
      id: "c1",
      name: "Computer-Aided Design (CAD)",
      issuer: "SolidWorks",
      date: "May 2023",
      link: "",
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "",
      venue: "",
      date: "",
      link: "",
      description: "",
    },
  ],
  target: { company: "", role: "", jobDescription: "" },
};

export const uid = () => Math.random().toString(36).slice(2, 10);