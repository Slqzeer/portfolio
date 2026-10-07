import type { Locale, LocalizedText, PortfolioContent } from "./types";

const text = (fr: string, en: string): LocalizedText => ({ fr, en });

export const localize = (value: LocalizedText, locale: Locale) => value[locale];

export const portfolioContent: PortfolioContent = {
  isSample: true,
  identity: {
    name: "Prénom Nom",
    role: text(
      "Ingénieur informatique — Data & IA",
      "Computer engineer — Data & AI",
    ),
    introduction: text(
      "Je transforme des données et des idées en produits utiles, fiables et faciles à comprendre.",
      "I turn data and ideas into useful, reliable products that are easy to understand.",
    ),
  },
  availability: text(
    "Stage de fin d’études · février 2027",
    "End-of-study internship · February 2027",
  ),
  navigation: {
    home: text("Accueil", "Home"),
    about: text("À propos", "About"),
    projects: text("Projets", "Projects"),
    homelab: text("Homelab", "Homelab"),
    experience: text("Parcours", "Experience"),
    contact: text("Contact", "Contact"),
  },
  actions: {
    explore: text("Explorer la chambre", "Explore the room"),
    replaceLink: text("Lien à remplacer", "Replace this link"),
  },
  social: {
    github: { label: text("GitHub", "GitHub"), href: "" },
    linkedin: { label: text("LinkedIn", "LinkedIn"), href: "" },
    cv: { label: text("CV", "Résumé"), href: "" },
    email: { label: text("E-mail", "Email"), href: "" },
  },
  skills: [
    {
      group: text("Data & IA", "Data & AI"),
      items: ["Python", "SQL", "Machine Learning", "RAG"],
    },
    {
      group: text("Logiciel", "Software"),
      items: ["TypeScript", "React", "Go", "PostgreSQL"],
    },
    {
      group: text("Infrastructure", "Infrastructure"),
      items: ["Linux", "Docker", "Kubernetes", "CI/CD"],
    },
  ],
  projectCategories: {
    "data-ai": text("Data & IA", "Data & AI"),
    software: text("Logiciel", "Software"),
    homelab: text("Homelab", "Homelab"),
    "game-development": text("Jeux", "Games"),
    experiments: text("Expériences", "Experiments"),
  },
  projects: [
    {
      id: "sample-rag-assistant",
      name: text(
        "Assistant documentaire — exemple",
        "Document assistant — sample",
      ),
      category: "data-ai",
      summary: text(
        "Recherche fiable dans une base documentaire.",
        "Reliable search across a document collection.",
      ),
      problem: text(
        "Retrouver rapidement une information sourcée.",
        "Find sourced information quickly.",
      ),
      solution: text(
        "Un pipeline RAG avec citations et évaluation.",
        "A RAG pipeline with citations and evaluation.",
      ),
      architecture: text(
        "API, index vectoriel et interface web.",
        "API, vector index, and web interface.",
      ),
      challenges: text(
        "Réduire les réponses non sourcées.",
        "Reduce unsupported answers.",
      ),
      learnings: text(
        "Évaluer avant d’optimiser.",
        "Evaluate before optimizing.",
      ),
      stack: ["Python", "PostgreSQL", "React"],
      status: text("Prototype fictif", "Fictional prototype"),
      github: "",
    },
    {
      id: "sample-homelab-observability",
      name: text(
        "Observabilité homelab — exemple",
        "Homelab observability — sample",
      ),
      category: "homelab",
      summary: text(
        "Tableau de bord pour des services auto-hébergés.",
        "Dashboard for self-hosted services.",
      ),
      problem: text(
        "Détecter les incidents avant les utilisateurs.",
        "Detect incidents before users do.",
      ),
      solution: text(
        "Métriques, journaux et alertes utiles.",
        "Useful metrics, logs, and alerts.",
      ),
      architecture: text(
        "Collecteurs, stockage temporel et dashboards.",
        "Collectors, time-series storage, and dashboards.",
      ),
      challenges: text("Limiter le bruit des alertes.", "Limit alert noise."),
      learnings: text(
        "Une alerte doit mener à une action.",
        "Every alert should lead to an action.",
      ),
      stack: ["Docker", "Prometheus", "Grafana"],
      status: text("Étude fictive", "Fictional study"),
      github: "",
    },
  ],
  homelab: {
    description: text(
      "Un terrain de jeu pour comprendre les systèmes en production.",
      "A playground for understanding production systems.",
    ),
    services: ["Linux", "Docker", "Virtualisation", "Monitoring"],
  },
  timeline: [
    {
      id: "epita-data-ai",
      period: "2024–2027",
      title: text(
        "Cycle ingénieur — Data & IA",
        "Engineering degree — Data & AI",
      ),
      description: text(
        "Formation et expériences à personnaliser.",
        "Education and experience to customize.",
      ),
    },
  ],
  volleyball: {
    title: text("Le collectif avant le score", "Team first, score second"),
    narrative: text(
      "Le volley nourrit ma constance et mon goût du travail collectif.",
      "Volleyball builds consistency and a taste for teamwork.",
    ),
    qualities: [
      text("Esprit d’équipe", "Teamwork"),
      text("Discipline", "Discipline"),
      text("Persévérance", "Perseverance"),
    ],
  },
  explorationTopics: [
    "Local LLMs",
    "RAG",
    "Agents",
    "MLOps",
    "Kubernetes",
    "Distributed systems",
    "Self-hosted AI",
    "Game architecture",
  ],
  contact: {
    invitation: text(
      "Parlons de vos défis Data, IA ou logiciel.",
      "Let’s discuss your Data, AI, or software challenges.",
    ),
    location: text(
      "France · mobilité à préciser",
      "France · mobility to be specified",
    ),
  },
  roomObjects: {
    monitor: {
      label: text("Projets Data et IA", "Data and AI projects"),
      detailId: "projects",
    },
    server: { label: text("Homelab", "Homelab"), detailId: "homelab" },
    volleyball: {
      label: text("Volley et qualités", "Volleyball and qualities"),
      detailId: "volleyball",
    },
    education: {
      label: text("Formation et expériences", "Education and experience"),
      detailId: "experience",
    },
    controller: {
      label: text("Développement de jeux", "Game development"),
      detailId: "game-development",
    },
    notebook: {
      label: text("Applications personnelles", "Personal applications"),
      detailId: "experiments",
    },
    bookshelf: {
      label: text("Explorations actuelles", "Currently exploring"),
      detailId: "exploring",
    },
    contact: { label: text("Me contacter", "Contact me"), detailId: "contact" },
    flag: {
      label: text("Changer de langue", "Change language"),
      detailId: "language",
    },
    window: {
      label: text("Changer la lumière", "Change lighting"),
      detailId: "theme",
    },
  },
  details: {
    projects: {
      title: text("Projets", "Projects"),
      summary: text(
        "Des projets expliqués par leur impact.",
        "Projects explained through their impact.",
      ),
    },
    homelab: {
      title: text("Homelab", "Homelab"),
      summary: text(
        "Apprendre en exploitant de vrais services.",
        "Learning by operating real services.",
      ),
    },
    volleyball: {
      title: text("Volley", "Volleyball"),
      summary: text(
        "Régularité, collectif et progression.",
        "Consistency, teamwork, and growth.",
      ),
    },
    experience: {
      title: text("Parcours", "Experience"),
      summary: text(
        "Formation et expériences importantes.",
        "Education and meaningful experience.",
      ),
    },
    "game-development": {
      title: text("Création de jeux", "Game development"),
      summary: text(
        "Technique, systèmes et créativité.",
        "Engineering, systems, and creativity.",
      ),
    },
    experiments: {
      title: text("Expériences", "Experiments"),
      summary: text("Des idées testées rapidement.", "Ideas tested quickly."),
    },
    exploring: {
      title: text("En exploration", "Currently exploring"),
      summary: text(
        "Les sujets que j’approfondis.",
        "Topics I am diving into.",
      ),
    },
    contact: {
      title: text("Contact", "Contact"),
      summary: text(
        "Construisons quelque chose d’utile.",
        "Let’s build something useful.",
      ),
    },
    language: {
      title: text("Langue", "Language"),
      summary: text("Français ou anglais.", "French or English."),
    },
    theme: {
      title: text("Ambiance", "Lighting"),
      summary: text(
        "Jour naturel ou nuit éclairée.",
        "Natural day or illuminated night.",
      ),
    },
  },
};
