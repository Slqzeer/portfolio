export type Locale = "fr" | "en";

export type LocalizedText = Record<Locale, string>;

export type RoomObjectId =
  | "monitor"
  | "server"
  | "volleyball"
  | "education"
  | "controller"
  | "notebook"
  | "bookshelf"
  | "contact"
  | "flag"
  | "window";

export type DetailId =
  | "projects"
  | "homelab"
  | "volleyball"
  | "experience"
  | "game-development"
  | "experiments"
  | "exploring"
  | "contact"
  | "language"
  | "theme";

export type ProjectCategory =
  "data-ai" | "software" | "homelab" | "game-development" | "experiments";

export interface Link {
  label: LocalizedText;
  href: string;
}

export interface Project {
  id: string;
  name: LocalizedText;
  category: ProjectCategory;
  summary: LocalizedText;
  problem: LocalizedText;
  solution: LocalizedText;
  architecture: LocalizedText;
  challenges: LocalizedText;
  learnings: LocalizedText;
  stack: string[];
  status: LocalizedText;
  github: string;
  demo?: string;
}

export interface TimelineEntry {
  id: string;
  period: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface DetailSection {
  title: LocalizedText;
  summary: LocalizedText;
}

export interface PortfolioContent {
  isSample: boolean;
  identity: {
    name: string;
    role: LocalizedText;
    introduction: LocalizedText;
  };
  availability: LocalizedText;
  navigation: Record<
    "home" | "about" | "projects" | "homelab" | "experience" | "contact",
    LocalizedText
  >;
  actions: Record<"explore" | "replaceLink", LocalizedText>;
  social: Record<"github" | "linkedin" | "cv" | "email", Link>;
  skills: Array<{ group: LocalizedText; items: string[] }>;
  projects: Project[];
  homelab: {
    description: LocalizedText;
    services: string[];
  };
  timeline: TimelineEntry[];
  volleyball: {
    title: LocalizedText;
    narrative: LocalizedText;
    qualities: LocalizedText[];
  };
  explorationTopics: string[];
  contact: {
    invitation: LocalizedText;
    location: LocalizedText;
  };
  roomObjects: Record<
    RoomObjectId,
    { label: LocalizedText; detailId: DetailId }
  >;
  details: Record<DetailId, DetailSection>;
}
