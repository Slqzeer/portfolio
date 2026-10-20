import type { Locale, LocalizedText, PortfolioContent } from "./types";

const text = (fr: string, en: string): LocalizedText => ({ fr, en });

export const localize = (value: LocalizedText, locale: Locale) => value[locale];

export const portfolioContent: PortfolioContent = {
  isSample: false,
  identity: {
    name: "Martin Couturier",
    role: text(
      "Étudiant ingénieur EPITA · Data & intelligence artificielle",
      "EPITA engineering student · Data & artificial intelligence",
    ),
    introduction: text(
      "Spécialisé en data science et intelligence artificielle, je conçois des produits logiciels de bout en bout. Bienvenue dans une autre façon de découvrir mon parcours.",
      "Specializing in data science and artificial intelligence, I build software products end to end. Welcome to a different way to discover my journey.",
    ),
  },
  availability: text(
    "Stage IA/Data en Île-de-France · Dès le 8 février 2027 · 5 mois minimum",
    "AI/Data internship in the Paris Region · From February 8, 2027 · 5 months minimum",
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
      href: "https://www.linkedin.com/in/martin-couturier/",
    },
    cv: { label: text("CV", "Résumé"), href: "" },
    email: {
      label: text("E-mail", "Email"),
      href: "mailto:martin.couturier.pro@gmail.com",
    },
  },
  skills: [
    {
      group: text(
        "Data & intelligence artificielle",
        "Data & artificial intelligence",
      ),
      items: ["Python", "LLM", "RAG", "Big Data", "SVM & méthodes à noyaux"],
    },
    {
      group: text("Interfaces web", "Web interfaces"),
      items: ["TypeScript", "React", "Angular", "HTML", "CSS"],
    },
    {
      group: text("Backend & qualité produit", "Backend & product quality"),
      items: [
        "FastAPI",
        "Java",
        "Spring Boot",
        "SonarQube",
        "Backend testing",
        "Product design",
      ],
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
      id: "advanced-rag",
      name: text(
        "Advanced RAG Knowledge Assistant",
        "Advanced RAG Knowledge Assistant",
      ),
      category: "data-ai",
      summary: text(
        "Un assistant documentaire RAG conçu pour produire des réponses traçables et mesurer chaque amélioration du retrieval.",
        "A document RAG assistant designed to produce traceable answers and measure every retrieval improvement.",
      ),
      problem: text(
        "Construire un système RAG fiable sans sélectionner ses composants sur une simple impression de qualité.",
        "Build a reliable RAG system without selecting components from subjective quality impressions.",
      ),
      solution: text(
        "Un pipeline progressif où le découpage, la recherche hybride, le reranking, les transformations de requête et la compression sont comparés sur un jeu d’évaluation annoté.",
        "A progressive pipeline where chunking, hybrid search, reranking, query transformations, and compression are compared on an annotated evaluation set.",
      ),
      architecture: text(
        "Ingestion de documents Markdown, embeddings mis en cache, indexation Qdrant, génération avec citations validées et bancs d’essai reproductibles.",
        "Markdown ingestion, cached embeddings, Qdrant indexing, generation with validated citations, and reproducible benchmarks.",
      ),
      challenges: text(
        "Mesurer honnêtement les variantes, conserver les résultats négatifs et ne promouvoir une technique que lorsqu’elle dépasse un seuil défini à l’avance.",
        "Measure variants honestly, retain negative results, and only promote a technique when it exceeds a predefined threshold.",
      ),
      learnings: text(
        "La compression contextuelle a porté le Recall@context de 0,721 à 0,814, tandis que plusieurs techniques plus complexes n’ont pas amélioré le Recall@5.",
        "Contextual compression raised Recall@context from 0.721 to 0.814, while several more complex techniques did not improve Recall@5.",
      ),
      stack: ["Python", "Qdrant", "Docker", "RAGAS"],
      status: text("Projet personnel en cours", "Ongoing personal project"),
      github: "https://github.com/Slqzeer/Advanced-RAG-Knowledge-Assistant",
    },
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
    {
      id: "ping",
      name: text("Ping", "Ping"),
      category: "software",
      summary: text(
        "Une application éducative consacrée à la gestion du matériel et à la prévention des troubles musculo-squelettiques dans les centres VHU.",
        "An educational application focused on equipment management and preventing musculoskeletal disorders in vehicle recycling centers.",
      ),
      problem: text(
        "Réduire les risques liés aux gestes, aux postures et à l’utilisation du matériel dans un environnement de travail physique.",
        "Reduce risks related to movement, posture, and equipment use in a physically demanding workplace.",
      ),
      solution: text(
        "Recentrer une première idée de traçabilité du matériel vers la santé des employés et la prévention des TMS.",
        "Refocus an initial equipment-tracking idea on employee health and musculoskeletal-disorder prevention.",
      ),
      architecture: text(
        "Un prototype d’application web conçu en équipe autour du suivi du matériel et des situations à risque.",
        "A team-built web application prototype centered on equipment tracking and risk situations.",
      ),
      challenges: text(
        "Faire évoluer le positionnement du produit après avoir constaté que le marché de la simple gestion de matériel était déjà saturé.",
        "Evolve the product positioning after finding that the basic equipment-management market was already saturated.",
      ),
      learnings: text(
        "Partir du besoin métier, remettre en question l’idée initiale et privilégier un problème utilisateur plus différenciant.",
        "Start from the business need, challenge the initial idea, and prioritize a more differentiated user problem.",
      ),
      stack: ["Product design", "Application web"],
      status: text(
        "Projet éducatif collectif · juin-juillet 2025",
        "Team educational project · June-July 2025",
      ),
    },
    {
      id: "pass-through",
      name: text("Pass-Through", "Pass-Through"),
      category: "game-development",
      summary: text(
        "Un prototype éducatif de jeu d’action multijoueur développé en équipe avec Unity.",
        "An educational multiplayer action-game prototype developed as a team with Unity.",
      ),
      problem: text(
        "Construire une boucle de jeu multijoueur réunissant déplacement, combat, portails, ennemis et suivi des scores.",
        "Build a multiplayer gameplay loop combining movement, combat, portals, enemies, and score tracking.",
      ),
      solution: text(
        "Un prototype organisé autour de scènes de connexion, de lobby et de jeu, avec synchronisation réseau via Mirror.",
        "A prototype organized around login, lobby, and gameplay scenes, with network synchronization through Mirror.",
      ),
      architecture: text(
        "Un client Unity en C# avec des systèmes séparés pour le joueur, les armes, l’IA, les portails, l’interface, le kill feed et le tableau des scores.",
        "A C# Unity client with separate systems for the player, weapons, AI, portals, UI, kill feed, and scoreboard.",
      ),
      challenges: text(
        "Coordonner les systèmes de gameplay et leur comportement en réseau dans un premier projet collectif de cette ampleur.",
        "Coordinate gameplay systems and their network behavior in a first team project of this scale.",
      ),
      learnings: text(
        "Structurer une scène Unity, découper les responsabilités de gameplay et collaborer sur un dépôt commun.",
        "Structure a Unity scene, separate gameplay responsibilities, and collaborate in a shared repository.",
      ),
      stack: ["Unity", "C#", "Mirror", "ShaderLab"],
      status: text(
        "Projet éducatif collectif · 2023",
        "Team educational project · 2023",
      ),
      github: "https://github.com/Projet-s2-2027/Pass-Through",
    },
  ],
  homelab: {
    description: text(
      "Un cluster Kubernetes auto-hébergé et piloté en GitOps pour expérimenter le déploiement, la sécurité, l’identité, les données et l’observabilité dans des conditions réelles.",
      "A self-hosted Kubernetes cluster managed through GitOps to explore deployment, security, identity, data, and observability under real conditions.",
    ),
    services: [
      "Kubernetes",
      "Argo CD",
      "HashiCorp Vault",
      "Tailscale",
      "PostgreSQL & Redis",
      "Prometheus & Grafana",
      "Penpot",
    ],
  },
  timeline: [
    {
      id: "epita-preparatory-cycle",
      period: text("2022 - 2024", "2022 - 2024"),
      title: text("Cycle préparatoire à l’EPITA", "EPITA preparatory cycle"),
      description: text(
        "Découverte de l’informatique bas niveau avec le C et réalisation de projets éducatifs, dont un OCR pour résoudre des sudokus et le jeu Unity/C# Pass-Through.",
        "Introduction to low-level programming with C and educational projects, including OCR for solving Sudoku puzzles and the Unity/C# game Pass-Through.",
      ),
    },
    {
      id: "croatia-semester",
      period: text("2023 - 2024", "2023 - 2024"),
      title: text(
        "Deuxième année - semestre international en Croatie",
        "Second year - international semester in Croatia",
      ),
      description: text(
        "Une immersion académique et culturelle qui m’a permis de gagner en autonomie et de participer à StreetSync, un projet web et mobile consacré aux événements et services locaux.",
        "An academic and cultural immersion that helped me become more independent and contribute to StreetSync, a web and mobile project for local events and services.",
      ),
    },
    {
      id: "engineering-core",
      period: text("2024 - 2025", "2024 - 2025"),
      title: text(
        "Première année du cycle ingénieur - tronc commun",
        "First engineering-cycle year - common core",
      ),
      description: text(
        "Acquisition des bases en Java, JavaScript, SQL et C++, avec un approfondissement de la programmation en C et de la conception logicielle.",
        "Built foundations in Java, JavaScript, SQL, and C++, while deepening my knowledge of C programming and software design.",
      ),
    },
    {
      id: "scia-foundations",
      period: text("2025 - 2026", "2025 - 2026"),
      title: text(
        "Deuxième année du cycle ingénieur - majeure SCIA",
        "Second engineering-cycle year - SCIA major",
      ),
      description: text(
        "Spécialisation en Data et IA : Big Data, modèles de langage, SVM, méthodes à noyaux et premiers projets appliqués.",
        "Specialization in Data and AI: Big Data, language models, SVMs, kernel methods, and initial applied projects.",
      ),
    },
    {
      id: "cacib",
      period: text(
        "Septembre 2025 - février 2026",
        "September 2025 - February 2026",
      ),
      title: text(
        "Développeur fullstack stagiaire - Crédit Agricole CIB",
        "Fullstack developer intern - Crédit Agricole CIB",
      ),
      description: text(
        "Amélioration d’un tableau de bord existant qui centralise les métriques de qualité et de sécurité du code de plusieurs équipes, collectées notamment avec SonarQube. Backend Java / Spring Boot et frontend TypeScript / Angular.",
        "Improved an existing dashboard centralizing code-quality and security metrics across several teams, collected notably through SonarQube. Java / Spring Boot backend and TypeScript / Angular frontend.",
      ),
    },
    {
      id: "scia-final-year",
      period: text("2026 - 2027", "2026 - 2027"),
      title: text(
        "Troisième année du cycle ingénieur - majeure SCIA",
        "Final engineering-cycle year - SCIA major",
      ),
      description: text(
        "Approfondissement de la Data et de l’IA, avec un PFEE mené avec Wavestone à l’intersection de la cybersécurité et de l’intelligence artificielle. Diplôme d’ingénieur prévu en 2027.",
        "Advanced Data and AI studies, including a final-year project with Wavestone at the intersection of cybersecurity and artificial intelligence. Engineering degree expected in 2027.",
      ),
    },
  ],
  volleyball: {
    title: text("Le collectif avant le score", "Team first, score second"),
    narrative: text(
      "Le volley m’a appris à progresser avec régularité, à communiquer et à jouer pour le collectif.",
      "Volleyball taught me to improve consistently, communicate, and put the team first.",
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
    text("Prototypage de jeux en Luau", "Game prototyping with Luau"),
    text(
      "Architecture de jeu client/serveur, microservices et EDA",
      "Client/server game architecture, microservices, and EDA",
    ),
    text(
      "Création d’assets avec Blender, Unity et Penpot",
      "Asset creation with Blender, Unity, and Penpot",
    ),
    text("Accessibilité", "Accessibility"),
    text("Performance", "Performance"),
  ],
  contact: {
    invitation: text(
      "Une idée, un projet, une envie d’échanger ?",
      "An idea, a project, or something to talk about?",
    ),
    location: text(
      "Basé en Île-de-France, je recherche un stage en tant qu’ingénieur Data & IA à partir du 8 février 2027.",
      "Based in the Paris Region, I am looking for a Data & AI engineering internship starting February 8, 2027.",
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
        "Un projet Unity public et des prototypes privés autour de Luau, du client/serveur, des microservices et de l’EDA.",
        "A public Unity project and private prototypes exploring Luau, client/server systems, microservices, and EDA.",
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
