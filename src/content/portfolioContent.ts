import type { Locale, LocalizedText, PortfolioContent } from "./types";

const text = (fr: string, en: string): LocalizedText => ({ fr, en });

export const localize = (value: LocalizedText, locale: Locale) => value[locale];

export const portfolioContent: PortfolioContent = {
  isSample: false,
  identity: {
    name: "Martin Couturier",
    role: text(
      "Étudiant en 5e année · Développement fullstack",
      "Fifth-year student · Fullstack development",
    ),
    introduction: text(
      "Bienvenue chez moi. Une chambre à explorer, des projets à découvrir et une autre façon de faire connaissance.",
      "Welcome to my space. A room to explore, projects to discover, and a different way to get to know me.",
    ),
  },
  availability: text(
    "Construire, expérimenter, partager.",
    "Build, experiment, share.",
  ),
  navigation: {
    home: text("Accueil", "Home"),
    about: text("À propos", "About"),
    projects: text("Projets", "Projects"),
    skills: text("Compétences", "Skills"),
    homelab: text("Homelab", "Homelab"),
    experience: text("Parcours", "Experience"),
    contact: text("Contact", "Contact"),
  },
  actions: {
    explore: text("Explorer la chambre", "Explore the room"),
    replaceLink: text("Lien à remplacer", "Replace this link"),
  },
  social: {
    github: {
      label: text("GitHub", "GitHub"),
      href: "https://github.com/Slqzeer",
    },
    linkedin: {
      label: text("LinkedIn", "LinkedIn"),
      href: "https://www.linkedin.com/in/martin-couturier",
    },
    cv: { label: text("CV", "Résumé"), href: "" },
    email: { label: text("E-mail", "Email"), href: "" },
  },
  skills: [
    {
      group: text("Interfaces web", "Web interfaces"),
      items: ["TypeScript", "React", "HTML", "CSS"],
    },
    {
      group: text("Backend & qualité produit", "Backend & product quality"),
      items: ["Python", "FastAPI", "Backend testing", "Product design"],
    },
    {
      group: text("Création 3D", "3D creation"),
      items: ["Blender", "Three.js", "React Three Fiber", "glTF"],
    },
    {
      group: text("Qualité & outils", "Quality & tools"),
      items: ["Vite", "Vitest", "Playwright", "Git"],
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
      id: "portfolio",
      screenshots: [
        {
          src: "/assets/projects/portfolio-room.png",
          alt: text("La chambre interactive", "The interactive room"),
        },
        {
          src: "/assets/projects/portfolio-night.png",
          alt: text("La chambre de nuit", "The room at night"),
        },
      ],
      name: {
        fr: "Une chambre, un portfolio.",
        en: "A room, a portfolio.",
      },
      category: "software",
      summary: {
        fr: "Un espace personnel en 3D où chaque objet devient une porte vers mon travail.",
        en: "A personal 3D space where every object opens a door to my work.",
      },
      problem: {
        fr: "Présenter un parcours autrement, tout en gardant les informations faciles à consulter.",
        en: "Present a personal journey differently while keeping information easy to access.",
      },
      solution: {
        fr: "Une chambre interactive, des déplacements guidés et des fiches de contenu en HTML.",
        en: "An interactive room, guided camera journeys, and readable HTML content.",
      },
      architecture: {
        fr: "Une scène Blender exportée en glTF, intégrée à React avec React Three Fiber. Les contenus français et anglais sont séparés de la scène.",
        en: "A Blender scene exported as glTF, integrated into React with React Three Fiber. French and English content lives independently of the scene.",
      },
      challenges: {
        fr: "Cadrer les objets sans traverser le mobilier, adapter la lecture au mobile et conserver un accès aux contenus si la 3D échoue.",
        en: "Frame objects without crossing furniture, adapt reading to mobile, and keep content accessible if 3D fails.",
      },
      learnings: {
        fr: "La 3D donne une présence au lieu ; la typographie et la navigation rendent le parcours compréhensible.",
        en: "3D gives a space its presence; typography and navigation make the journey understandable.",
      },
      stack: ["React", "TypeScript", "Three.js", "Blender"],
      status: {
        fr: "En évolution",
        en: "Evolving",
      },
      github: "https://github.com/Slqzeer/portfolio",
    },
    {
      id: "classpulse",
      screenshots: [
        {
          src: "/assets/projects/classpulse-homepage.png",
          alt: text(
            "ClassPulse : page d’accueil et tableau de bord",
            "ClassPulse: homepage and dashboard",
          ),
        },
        {
          src: "/assets/projects/classpulse-session.png",
          alt: text(
            "ClassPulse : session d’accompagnement agentique",
            "ClassPulse: agentic support session",
          ),
        },
      ],
      name: {
        fr: "ClassPulse",
        en: "ClassPulse",
      },
      category: "data-ai",
      summary: {
        fr: "Un système agentique pour accompagner les étudiants et aider à prévenir le décrochage scolaire.",
        en: "An agentic system to support students and help prevent school dropout.",
      },
      problem: {
        fr: "Aider les étudiants à rester engagés dans leur parcours scolaire.",
        en: "Help students stay engaged in their education.",
      },
      solution: {
        fr: "Conception d’un système d’aide aux étudiants reposant sur une approche agentique.",
        en: "Design of an agent-based student support system.",
      },
      architecture: {
        fr: "Un backend Python exposé avec FastAPI.",
        en: "A Python backend exposed through FastAPI.",
      },
      challenges: {
        fr: "Mon rôle : contribuer à la conception, tester et vérifier le backend, et veiller à la qualité du produit.",
        en: "My role: contribute to design, test and verify the backend, and oversee product quality.",
      },
      learnings: {
        fr: "Faire de la vérification du backend et de la qualité produit une partie du travail de conception.",
        en: "Make backend verification and product quality part of the design process.",
      },
      stack: ["Python", "FastAPI", "Agentic system"],
      status: {
        fr: "Projet collectif",
        en: "Team project",
      },
      github: "https://github.com/Ghost-in-xav/ClassPulse",
    },
  ],
  homelab: {
    description: text(
      "Le rack de la chambre ouvre un espace dédié aux systèmes et à l’auto-hébergement. Sa présentation technique sera complétée avec la configuration réelle.",
      "The room’s rack opens a space for systems and self-hosting. Its technical presentation will be completed with the actual configuration.",
    ),
    services: [],
  },
  timeline: [
    {
      id: "current-studies",
      period: text("En cours", "Current"),
      title: text("Étudiant en 5e année", "Fifth-year student"),
      description: text(
        "Dernière année d’études, avec une pratique centrée sur la conception et le développement de produits logiciels.",
        "Final year of studies, with a focus on software product design and development.",
      ),
    },
    {
      id: "cacib",
      period: text("Expérience professionnelle", "Professional experience"),
      title: text(
        "Développement fullstack — CACIB",
        "Fullstack development — CACIB",
      ),
      description: text(
        "Une expérience en développement fullstack au sein de Crédit Agricole Corporate and Investment Bank.",
        "Fullstack development experience at Crédit Agricole Corporate and Investment Bank.",
      ),
    },
    {
      id: "classpulse",
      period: text("Projet collectif", "Team project"),
      title: text(
        "ClassPulse — conception & qualité",
        "ClassPulse — design & quality",
      ),
      description: text(
        "Conception du produit, tests et vérification du backend Python / FastAPI d’un système agentique d’aide aux étudiants.",
        "Product design, testing, and verification of the Python / FastAPI backend of an agentic student support system.",
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
    text("Interfaces interactives", "Interactive interfaces"),
    text("3D pour le web", "3D for the web"),
    text("Accessibilité", "Accessibility"),
    text("Performance", "Performance"),
  ],
  contact: {
    invitation: text(
      "Une idée, un projet, une envie d’échanger ?",
      "An idea, a project, or something to talk about?",
    ),
    location: text(
      "Retrouvez-moi sur LinkedIn ou explorez mon code sur GitHub.",
      "Find me on LinkedIn or explore my code on GitHub.",
    ),
  },
  roomObjects: {
    desk: {
      label: text("Bureau et projets", "Desk and projects"),
      detailId: "projects",
    },
    monitor: {
      label: text("Mes projets", "My projects"),
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
    smartphone: {
      label: text("Applications personnelles", "Personal applications"),
      detailId: "experiments",
    },
    bookshelf: {
      label: text("Compétences et explorations", "Skills and explorations"),
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
      title: text("Compétences", "Skills"),
      summary: text(
        "Des outils, des méthodes et une curiosité qui ne s’arrête pas.",
        "Tools, methods, and a curiosity that keeps growing.",
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
