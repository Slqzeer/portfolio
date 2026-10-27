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
    replaceLink: text("Document bientôt disponible", "Document coming soon"),
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
    cv: {
      label: text("CV", "Résumé"),
      href: "/assets/documents/CV-Martin-Couturier.pdf",
    },
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
      items: [
        "Python",
        "LLM",
        "RAG",
        "Big Data",
        text("SVM et méthodes à noyaux", "SVMs and kernel methods"),
      ],
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
        text("Tests backend", "Backend testing"),
        text("Conception produit", "Product design"),
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
    experiments: text("Expérimentations", "Experiments"),
  },
  projects: [
    {
      id: "advanced-rag",
      screenshots: [
        {
          src: "/assets/projects/advanced-rag-chat.png",
          alt: text(
            "Advanced RAG : espace de discussion avec sources",
            "Advanced RAG: grounded chat workspace",
          ),
        },
        {
          src: "/assets/projects/advanced-rag-overview.png",
          alt: text(
            "Advanced RAG : tableau de bord des performances",
            "Advanced RAG: performance dashboard",
          ),
        },
      ],
      name: text(
        "Advanced RAG Knowledge Assistant",
        "Advanced RAG Knowledge Assistant",
      ),
      category: "data-ai",
      summary: text(
        "Un assistant documentaire RAG conçu pour produire des réponses traçables et évaluer la qualité de la recherche d’information.",
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
        "Comparer les variantes sur des critères mesurables, documenter les résultats négatifs et ne retenir une technique que si elle dépasse un seuil défini à l’avance.",
        "Compare variants against measurable criteria, document negative results, and adopt a technique only when it exceeds a predefined threshold.",
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
      id: "medtriage-ai",
      screenshots: [
        {
          src: "/assets/projects/medtriage-session.png",
          alt: text(
            "MedTriage AI : échange de triage et orientation médicale",
            "MedTriage AI: triage conversation and medical guidance",
          ),
        },
        {
          src: "/assets/projects/medtriage-home.png",
          alt: text(
            "MedTriage AI : accueil et saisie des symptômes",
            "MedTriage AI: symptom entry screen",
          ),
        },
      ],
      name: text("MedTriage AI", "MedTriage AI"),
      category: "data-ai",
      summary: text(
        "Un prototype académique de triage médical qui combine dialogue, règles de sécurité, modèle de classification et analyse d’image pour proposer une orientation prudente.",
        "An academic medical-triage prototype combining conversation, safety rules, a classification model, and image analysis to suggest cautious next steps.",
      ),
      problem: text(
        "Transformer une description libre de symptômes en une orientation compréhensible sans confier la décision critique au seul modèle de langage.",
        "Turn a free-form symptom description into understandable guidance without leaving the critical decision to a language model alone.",
      ),
      solution: text(
        "Un orchestrateur retient le niveau d’urgence le plus élevé parmi les règles déterministes, le modèle ML et l’analyse visuelle, puis utilise le LLM pour formuler la réponse et poursuivre l’échange.",
        "An orchestrator keeps the highest urgency signaled by deterministic rules, the ML model, and visual analysis, then uses the LLM to phrase the response and continue the conversation.",
      ),
      architecture: text(
        "Une interface React échange avec une API FastAPI, des services Flask dédiés au ML et à la vision, et un serveur MCP donnant accès à des sources médicales officielles.",
        "A React interface connects to a FastAPI service, dedicated Flask services for ML and vision, and an MCP server exposing official medical sources.",
      ),
      challenges: text(
        "Conserver le contexte des questions de suivi, gérer les fournisseurs LLM de secours et intégrer des connaissances externes sans affaiblir les règles de triage.",
        "Preserve follow-up context, handle fallback LLM providers, and integrate external knowledge without weakening the triage rules.",
      ),
      learnings: text(
        "Dans un domaine sensible, l’IA générative est plus utile pour expliquer une décision encadrée que pour déterminer seule le niveau d’urgence.",
        "In a sensitive domain, generative AI is more useful for explaining a bounded decision than for determining urgency on its own.",
      ),
      stack: ["Python", "FastAPI", "MCP", "React", "Docker"],
      status: text(
        "Projet académique collectif · 2026",
        "Team academic project · 2026",
      ),
      github: "https://github.com/gitmehdii/medtriage-ai",
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
      id: "homelab-portal",
      screenshots: [
        {
          src: "/assets/projects/homelab-portal-catalog.png",
          alt: text(
            "Homelab Portal : catalogue des services publiés",
            "Homelab Portal: published service catalog",
          ),
        },
        {
          src: "/assets/projects/homelab-portal-diagnostics.png",
          alt: text(
            "Homelab Portal : diagnostics de publication en lecture seule",
            "Homelab Portal: read-only publication diagnostics",
          ),
        },
      ],
      name: text("Homelab Portal", "Homelab Portal"),
      category: "homelab",
      summary: text(
        "Un catalogue de services auto-hébergé, en lecture seule, conçu pour rendre mon homelab facile à parcourir sans élargir les droits d’accès.",
        "A self-hosted, read-only service catalog that makes my homelab easy to browse without expanding access rights.",
      ),
      problem: text(
        "Retrouver les applications disponibles sur le réseau local et le tailnet tout en séparant clairement découverte, authentification et autorisation.",
        "Find applications available on the local network and tailnet while keeping discovery, authentication, and authorization clearly separated.",
      ),
      solution: text(
        "Un portail authentifié par Keycloak découvre uniquement les Ingress Tailscale explicitement publiés et présente leur état sans accorder d’accès aux applications cibles.",
        "A Keycloak-authenticated portal discovers only explicitly published Tailscale Ingresses and presents their status without granting access to target applications.",
      ),
      architecture: text(
        "Un BFF en Go et son interface embarquée utilisent une identité Kubernetes en lecture seule. Les manifests durcis, la chaîne de publication et un environnement jetable couvrent la livraison et la recette.",
        "A Go BFF and embedded interface use a read-only Kubernetes identity. Hardened manifests, a release pipeline, and a disposable environment cover delivery and acceptance.",
      ),
      challenges: text(
        "Tester les frontières réelles — sessions OIDC, RBAC, isolation réseau et données périmées — sans confondre validation hors ligne et preuve en production.",
        "Test real boundaries—OIDC sessions, RBAC, network isolation, and stale data—without confusing offline validation with live evidence.",
      ),
      learnings: text(
        "Une interface d’exploitation utile doit rendre son périmètre de confiance visible et fournir des preuves séparées pour le code, la livraison et l’environnement réel.",
        "A useful operations interface should make its trust boundary visible and provide separate evidence for source, delivery, and the live environment.",
      ),
      stack: ["Go", "Kubernetes", "Keycloak", "Tailscale"],
      status: text("Projet personnel en cours", "Ongoing personal project"),
      github: "https://github.com/Slqzeer/homelab-portal",
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
        fr: "Un backend Python dont l’API est développée avec FastAPI.",
        en: "A Python backend with an API built using FastAPI.",
      },
      challenges: {
        fr: "Contribuer à la conception du système et vérifier la fiabilité du backend par les tests.",
        en: "Contribute to the system design and verify backend reliability through testing.",
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
      screenshots: [
        {
          src: "/assets/projects/ping-overview.png",
          alt: text(
            "Ping : tableau de bord de suivi du matériel et des risques ergonomiques",
            "Ping: equipment and ergonomic-risk dashboard",
          ),
        },
      ],
      name: text("Ping", "Ping"),
      category: "software",
      summary: text(
        "Un prototype réalisé dans le cadre d’un projet pédagogique, consacré au suivi du matériel et à la prévention des troubles musculosquelettiques (TMS) dans les centres de traitement des véhicules hors d’usage (VHU).",
        "A prototype built as a coursework project, focused on equipment tracking and musculoskeletal disorder prevention in end-of-life vehicle treatment centers.",
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
        "Faire évoluer le positionnement du produit pour mieux répondre aux besoins de prévention identifiés.",
        "Refine the product positioning to better address the identified prevention needs.",
      ),
      learnings: text(
        "Partir du besoin métier et remettre en question l’idée initiale pour traiter un problème concret rencontré par les utilisateurs.",
        "Start from the business need and challenge the initial idea to address a concrete user problem.",
      ),
      stack: ["Product design", "Application web"],
      status: text(
        "Projet éducatif collectif · juin-juillet 2025",
        "Team educational project · June-July 2025",
      ),
    },
    {
      id: "pass-through",
      screenshots: [
        {
          src: "/assets/projects/pass-through-cover.png",
          alt: text(
            "Pass-Through : visuel du prototype d’action multijoueur",
            "Pass-Through: multiplayer action prototype artwork",
          ),
        },
      ],
      name: text("Pass-Through", "Pass-Through"),
      category: "game-development",
      summary: text(
        "Un prototype de jeu d’action multijoueur développé en équipe avec Unity dans le cadre d’un projet pédagogique.",
        "A multiplayer action-game prototype developed as a team with Unity as part of a coursework project.",
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
    {
      id: "hermes",
      name: text("Hermes", "Hermes"),
      category: "experiments",
      summary: text(
        "Une plateforme personnelle qui me permet de piloter et de suivre des automatisations depuis mon téléphone avec Telegram.",
        "A personal platform for controlling and monitoring automations from my phone through Telegram.",
      ),
      problem: text(
        "Lancer des tâches, suivre leur progression et recevoir les alertes importantes sans rester devant mon poste de travail.",
        "Start tasks, follow their progress, and receive important alerts without staying at my workstation.",
      ),
      solution: text(
        "Une interface Telegram reliée à Hermes pour transmettre les demandes et renvoyer les événements du tableau de tâches et des opérations planifiées.",
        "A Telegram interface connected to Hermes that submits requests and returns task-board events and scheduled-operation alerts.",
      ),
      architecture: text(
        "Des adaptateurs Python synchronisent les issues GitHub, orchestrent les tâches, surveillent les revues et exécutent des opérations planifiées. Le gateway Hermes centralise l’exécution et les notifications mobiles.",
        "Python adapters synchronize GitHub issues, orchestrate tasks, watch reviews, and run scheduled operations. The Hermes gateway centralizes execution and mobile notifications.",
      ),
      challenges: text(
        "Rendre l’automatisation fiable sans supervision, isoler les secrets et permettre une reprise sûre après un redémarrage ou l’échec d’une tâche.",
        "Make unattended automation reliable, isolate secrets, and recover safely after a restart or task failure.",
      ),
      learnings: text(
        "Une automatisation utile dépend autant de limites explicites, de notifications lisibles et de procédures de reprise que de l’agent qui exécute le travail.",
        "Useful automation depends as much on explicit boundaries, readable notifications, and recovery procedures as on the agent doing the work.",
      ),
      stack: ["Python", "Hermes Agent", "Telegram", "GitHub"],
      status: text(
        "Expérimentation personnelle en cours",
        "Ongoing personal experiment",
      ),
    },
  ],
  homelab: {
    description: text(
      "Un laboratoire personnel auto-hébergé, organisé autour d’un cluster Kubernetes piloté en GitOps. J’y expérimente le déploiement de services, la sécurité, la gestion des identités, les données et l’observabilité.",
      "A self-hosted personal lab built around a Kubernetes cluster managed through GitOps. I use it to explore service deployment, security, identity management, data, and observability.",
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
      period: text("Février - juillet 2024", "February - July 2024"),
      title: text(
        "Deuxième année - échange international à Algebra University College, Zagreb",
        "Second year - international exchange at Algebra University College, Zagreb",
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
        "Stage en développement full stack — Crédit Agricole CIB",
        "Full-stack development internship — Crédit Agricole CIB",
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
        "Approfondissement de la data science et de l’IA, avec un projet de fin d’études en entreprise (PFEE) mené avec Wavestone à l’intersection de la cybersécurité et de l’intelligence artificielle. Diplôme d’ingénieur prévu en 2027.",
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
      "Architecture de jeu client-serveur, microservices et architecture événementielle",
      "Client-server game architecture, microservices, and event-driven architecture",
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
        "Les objectifs, les choix techniques et les enseignements de mes projets.",
        "The goals, technical decisions, and lessons behind my projects.",
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
        "Ma formation et mes expériences professionnelles.",
        "My education and professional experience.",
      ),
    },
    "game-development": {
      title: text("Création de jeux", "Game development"),
      summary: text(
        "Un projet Unity public et des prototypes privés explorant Luau, les systèmes client-serveur, les microservices et l’architecture événementielle.",
        "A public Unity project and private prototypes exploring Luau, client-server systems, microservices, and event-driven architecture.",
      ),
    },
    experiments: {
      title: text("Expérimentations", "Experiments"),
      summary: text(
        "Prototypes et applications personnelles.",
        "Prototypes and personal applications.",
      ),
    },
    exploring: {
      title: text("Compétences", "Skills"),
      summary: text(
        "Les technologies et méthodes que je mobilise dans mes projets.",
        "The technologies and methods I use in my projects.",
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
