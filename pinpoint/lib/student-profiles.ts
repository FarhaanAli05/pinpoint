/** Hardcoded "Students like you" profiles — similar needs so users can see potential roommates */
export interface StudentProfile {
  id: string;
  name: string;
  budget: string;
  moveIn: string;
  prefs: string[];
  note: string;
  contactEmail: string;
}

export const STUDENT_PROFILES: StudentProfile[] = [
  {
    id: "student-1",
    name: "Alex",
    budget: "$600 – $800",
    moveIn: "Sept 2025",
    prefs: ["Quiet", "Smoking-free"],
    note: "Grad student, prefer same area as campus.",
    contactEmail: "alex.student@example.com",
  },
  {
    id: "student-2",
    name: "Jordan",
    budget: "$700 – $900",
    moveIn: "Sept 2025",
    prefs: ["Pet-free", "Quiet"],
    note: "Looking for 2 roommates to share a 3BR.",
    contactEmail: "jordan.student@example.com",
  },
  {
    id: "student-3",
    name: "Sam",
    budget: "Under $600",
    moveIn: "May 2025",
    prefs: ["Smoking-free"],
    note: "Summer sublet then maybe longer. Easygoing.",
    contactEmail: "sam.student@example.com",
  },
  {
    id: "student-4",
    name: "Riley",
    budget: "$800 – $1000",
    moveIn: "Sept 2025",
    prefs: ["Quiet", "Pet-free", "Smoking-free"],
    note: "Prefer downtown, need 1 roommate.",
    contactEmail: "riley.student@example.com",
  },
];
