/* =========================================================
   SkillBridge AI — demo recommendation engine
   All recommendations are generated locally from curated data.
   ========================================================= */
"use strict";

(() => {
  const STORAGE_KEY = "skillbridge-ai-plan-v1";
  const PLAN_WEEKS = 4;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const CIRCUMFERENCE = 2 * Math.PI * 50;

  /* ---------------------------------------------------------
     Curated role library (the local "AI" demo knowledge base)
     --------------------------------------------------------- */
  const GOALS = {
    frontend: {
      label: "Frontend Developer",
      icon: "code",
      intro: "Your plan focuses on the interface layer: clean structure, responsive layouts, modern JavaScript, and one polished app that proves you can ship.",
      skills: [
        { name: "Modern JavaScript", keywords: ["javascript", "js", "typescript", "es6", "ecmascript"], description: "Build interactive experiences with functions, arrays, DOM events, and async requests.", icon: "code" },
        { name: "Responsive CSS", keywords: ["html", "css", "responsive", "flexbox", "grid", "tailwind", "sass", "scss"], description: "Turn any design into a layout that feels deliberate from phone to widescreen.", icon: "layers" },
        { name: "React fundamentals", keywords: ["react", "next.js", "nextjs", "vue", "svelte", "angular"], description: "Think in components, props, and state — the toolkit many frontend teams use daily.", icon: "grid" },
        { name: "Git & GitHub", keywords: ["git", "github", "version control"], description: "Ship changes safely and collaborate without losing work or confidence.", icon: "git" },
        { name: "Accessibility basics", keywords: ["accessibility", "a11y", "semantic html", "aria", "wcag"], description: "Build interfaces that work for keyboard, screen-reader, and mobile users too.", icon: "eye" },
        { name: "API integration", keywords: ["api", "fetch", "rest", "axios", "json"], description: "Load real data and handle loading, empty, and error states like a thoughtful developer.", icon: "cloud" }
      ],
      bonusSkills: [
        { name: "TypeScript", keywords: ["typescript", "ts"], description: "Add safer types to your components and reduce avoidable bugs.", icon: "shield" },
        { name: "Frontend testing", keywords: ["test", "testing", "jest", "vitest", "playwright"], description: "Protect key user flows with a small, reliable test suite.", icon: "check" },
        { name: "Web performance", keywords: ["performance", "lighthouse", "optimization", "web vitals"], description: "Make pages feel instant by measuring and trimming what ships to the browser.", icon: "zap" }
      ],
      weeks: [
        { title: "Rebuild your UI foundation", outcome: "A responsive component you can explain line by line.", tasks: ["Audit three sites you admire and note their layout, spacing, and color choices.", "Build a responsive profile card from a blank file using Flexbox and Grid.", "Add visible keyboard focus states and run a basic accessibility check."] },
        { title: "Make JavaScript click", outcome: "A small interactive app powered by real data.", tasks: ["Build an interactive to-do list that saves its state.", "Fetch a public API and handle loading, empty, and error states.", "Refactor the logic into small, reusable functions with clear names."] },
        { title: "Think in components", outcome: "A component-driven interface with clean version history.", tasks: ["Recreate a dashboard card as a reusable component with props.", "Add state for a search box, filter, or modal interaction.", "Push the project to GitHub with a concise README and screenshots."] },
        { title: "Ship your portfolio project", outcome: "A published project and a 60-second story about it.", tasks: ["Polish the layout at 360px, 768px, and 1440px screen widths.", "Run Lighthouse and fix your two biggest accessibility issues.", "Publish the project, record a walkthrough, and link it from your portfolio."] }
      ],
      project: {
        title: "Pulseboard — a responsive habit dashboard",
        description: "Build a personal habit tracker with reusable cards, weekly filters, and saved progress. It proves layout skill, real JavaScript state, and thoughtful empty states in one focused build.",
        difficulty: "Intermediate",
        tags: ["HTML", "CSS", "JavaScript", "localStorage"],
        coverIcon: "chart",
        blueprint: ["Design three dashboard states: first visit, active week, and all habits complete.", "Add one thoughtful detail — keyboard shortcuts, a streak animation, or a weekly reflection.", "Publish it with a short case study explaining one tradeoff you made."]
      },
      questions: [
        { q: "Walk me through how you would make a page responsive from scratch.", tip: "Start with content priorities, then mobile-first layout, flexible grids, sensible breakpoints, and testing with real content — not just device widths." },
        { q: "What happens between typing a URL and seeing a rendered page?", tip: "Cover DNS, the request/response cycle, HTML parsing, CSS and JavaScript loading, and rendering. Show that you understand the browser as a system." },
        { q: "How do you decide when a component should manage its own state?", tip: "Talk about scope, reuse, and the cost of lifting state. A strong answer explains a tradeoff rather than claiming one pattern is always right." }
      ]
    },

    python: {
      label: "Python Developer",
      icon: "terminal",
      intro: "Your plan builds from Python fundamentals into APIs, testing, and a small service you can demonstrate. The goal is working software — not another folder of half-finished tutorials.",
      skills: [
        { name: "Python fundamentals", keywords: ["python", "py", "oop", "functions"], description: "Use data structures, functions, modules, and error handling without leaning on copy-paste.", icon: "terminal" },
        { name: "API development", keywords: ["api", "rest", "fastapi", "flask", "django", "http"], description: "Design clean endpoints and understand requests, responses, validation, and status codes.", icon: "cloud" },
        { name: "Data handling", keywords: ["pandas", "numpy", "csv", "json", "data"], description: "Read, clean, and transform real data without losing track of edge cases.", icon: "database" },
        { name: "Testing & debugging", keywords: ["test", "pytest", "unit test", "debugging", "unittest"], description: "Write small tests, read tracebacks calmly, and fix the actual cause of a bug.", icon: "check" },
        { name: "SQL basics", keywords: ["sql", "database", "postgres", "postgresql", "sqlite", "mysql"], description: "Store and query structured data with confidence in real applications.", icon: "database" },
        { name: "Git & GitHub", keywords: ["git", "github", "version control"], description: "Keep a clean project history and collaborate on code without fear.", icon: "git" }
      ],
      bonusSkills: [
        { name: "Automation scripting", keywords: ["automation", "scripting", "selenium", "beautifulsoup"], description: "Turn repetitive manual work into small, reliable scripts.", icon: "zap" },
        { name: "Docker basics", keywords: ["docker", "container", "containers"], description: "Package your app so it runs the same way on every machine.", icon: "layers" },
        { name: "Async Python", keywords: ["async", "asyncio", "concurrency"], description: "Understand when concurrency helps and when it adds complexity.", icon: "refresh" }
      ],
      weeks: [
        { title: "Go beyond the syntax", outcome: "A clean Python utility with tests and a README.", tasks: ["Rebuild a small script without following a tutorial, using functions and clear names.", "Practice lists, dictionaries, file handling, and exceptions with three tiny exercises.", "Add a README that explains what your script does and how to run it."] },
        { title: "Build your first API", outcome: "A documented API running on your machine.", tasks: ["Create a small CRUD endpoint for a resource you care about, like books or workouts.", "Validate input and return useful errors instead of crashing.", "Test every endpoint with a REST client and export a short collection."] },
        { title: "Add data and confidence", outcome: "Persistent data and a passing test suite.", tasks: ["Connect your API to SQLite and write two useful queries.", "Add three tests that cover a success case, a validation case, and a failure case.", "Use Git branches and write commit messages a teammate could understand."] },
        { title: "Ship a small service", outcome: "A deployable API with docs and a case study.", tasks: ["Add filtering, pagination, or a simple search endpoint.", "Deploy the API or record a reliable local setup guide with screenshots.", "Write a short case study explaining the problem, design, and one hard bug you solved."] }
      ],
      project: {
        title: "Campus API — a useful local events service",
        description: "Create a REST API that stores campus events, filters by category and date, and returns clean JSON. Add tests and auto-generated docs so another developer could use it without asking you.",
        difficulty: "Intermediate",
        tags: ["Python", "FastAPI", "SQLite", "pytest"],
        coverIcon: "terminal",
        blueprint: ["Start with one user story and three endpoints; resist adding features too early.", "Add a seed script so reviewers can explore realistic data immediately.", "Document one failure case and how your API handles it gracefully."]
      },
      questions: [
        { q: "What is the difference between a list and a tuple, and when would you use each?", tip: "Explain mutability, intent, and use cases such as fixed configuration or records. A concise example is stronger than a memorized definition." },
        { q: "How would you design an endpoint for filtering events by date and category?", tip: "Talk through query parameters, validation defaults, database indexes, pagination, and a predictable response shape." },
        { q: "Tell me about a bug you debugged. How did you find the cause?", tip: "Use situation → action → result. Mention reproducing the issue, reading the traceback, isolating variables, and how you prevented a repeat." }
      ]
    },

    data: {
      label: "Data Analyst",
      icon: "chart",
      intro: "Your plan connects spreadsheet fluency to SQL, visualization, and clear data storytelling. You will finish with an analysis someone can understand in under two minutes.",
      skills: [
        { name: "Spreadsheet fluency", keywords: ["excel", "sheets", "spreadsheet", "google sheets"], description: "Clean, sort, and summarize data with formulas and pivot tables without losing accuracy.", icon: "grid" },
        { name: "SQL for analysis", keywords: ["sql", "mysql", "postgres", "postgresql", "sqlite", "queries"], description: "Ask precise questions of large datasets using joins, filters, and aggregations.", icon: "database" },
        { name: "Data visualization", keywords: ["tableau", "power bi", "powerbi", "looker", "charts", "visualization", "dataviz"], description: "Choose the right chart and build dashboards that make the insight obvious.", icon: "chart" },
        { name: "Python or pandas", keywords: ["python", "pandas", "numpy", "r", "jupyter"], description: "Automate repetitive cleaning and analysis when spreadsheets reach their limit.", icon: "terminal" },
        { name: "Statistics essentials", keywords: ["statistics", "stats", "probability", "a/b testing", "hypothesis"], description: "Interpret variation, averages, and experiments without drawing false conclusions.", icon: "chart" },
        { name: "Data storytelling", keywords: ["storytelling", "dashboard", "presentation", "insights", "report", "communication"], description: "Turn analysis into a clear recommendation that busy stakeholders can act on.", icon: "mic" }
      ],
      bonusSkills: [
        { name: "Data cleaning", keywords: ["cleaning", "data cleaning", "etl", "quality"], description: "Spot duplicates, missing values, and inconsistent formats before they skew results.", icon: "sliders" },
        { name: "dbt or analytics engineering", keywords: ["dbt", "analytics engineering", "warehouse"], description: "Bring structure and repeatability to transformations in a modern data stack.", icon: "layers" },
        { name: "Experiment analysis", keywords: ["experiment", "a/b", "ab testing", "conversion"], description: "Design and interpret experiments with a clear metric and a cautious conclusion.", icon: "target" }
      ],
      weeks: [
        { title: "Get comfortable with real data", outcome: "A cleaned dataset and a short insight summary.", tasks: ["Download a public dataset you find genuinely interesting and write down three questions.", "Clean duplicates, blanks, and inconsistent formats in a spreadsheet.", "Use pivot tables or formulas to find one surprising pattern."] },
        { title: "Ask better questions with SQL", outcome: "A set of queries that answer your key questions.", tasks: ["Load your dataset into SQLite and practise filtering, grouping, and ordering.", "Write one query with a join and one with a calculated metric.", "Save your best queries with comments explaining what each one answers."] },
        { title: "Make the insight visible", outcome: "A clear dashboard with one main takeaway.", tasks: ["Build three charts that each answer a different question.", "Remove clutter and label the chart a busy stakeholder would read first.", "Write a 100-word recommendation grounded in the data."] },
        { title: "Turn analysis into a story", outcome: "A portfolio case study with a visual and a point of view.", tasks: ["Assemble your dashboard into a short slide deck or one-page report.", "Add a limitations section that shows intellectual honesty.", "Record a two-minute walkthrough and publish it with the project."] }
      ],
      project: {
        title: "CityPulse — public transport insights",
        description: "Analyze a city's public transport data to answer one focused question, such as where delays cluster or when demand peaks. Finish with a clean dashboard and a recommendation a transport planner could use.",
        difficulty: "Intermediate",
        tags: ["Spreadsheets", "SQL", "Tableau", "Storytelling"],
        coverIcon: "chart",
        blueprint: ["Pick one decision your analysis could influence — that keeps the dashboard focused.", "Show data quality checks and explain any rows you excluded.", "End with one recommendation and one limitation, not just a wall of charts."]
      },
      questions: [
        { q: "Walk me through how you clean a messy dataset.", tip: "Mention profiling, missing values, duplicates, consistency, validation, and documenting changes. Explain how you decide what to exclude." },
        { q: "A key metric dropped 20% week over week. How would you investigate?", tip: "Clarify the definition, check data quality, segment by time and cohort, look for external events, then communicate hypotheses before conclusions." },
        { q: "How would you explain a complex analysis to a non-technical stakeholder?", tip: "Lead with the decision and the headline. Use one chart, plain language, and a clear next step; keep the methodology available but secondary." }
      ]
    },

    ux: {
      label: "UI/UX Designer",
      icon: "pen",
      intro: "Your plan balances visual craft with evidence: research, user flows, prototyping, and a case study that shows how you think — not just how you decorate.",
      skills: [
        { name: "Design foundations", keywords: ["design", "typography", "color theory", "layout", "visual design"], description: "Use type, color, spacing, and hierarchy to make interfaces feel clear and intentional.", icon: "pen" },
        { name: "Figma fluency", keywords: ["figma", "prototyping", "figjam", "auto layout"], description: "Move from rough idea to responsive components and a clickable prototype.", icon: "layers" },
        { name: "User research", keywords: ["research", "interview", "survey", "usability", "user testing"], description: "Ask better questions and turn observations into design decisions.", icon: "search" },
        { name: "Information architecture", keywords: ["wireframe", "information architecture", "user flow", "ux", "journey map"], description: "Organize content and flows so people can find what they need without friction.", icon: "route" },
        { name: "Prototyping & testing", keywords: ["prototype", "interaction design", "testing", "usability testing"], description: "Test an idea before polishing pixels, then improve it with evidence.", icon: "play" },
        { name: "Case study storytelling", keywords: ["case study", "portfolio", "presentation", "storytelling"], description: "Explain the problem, decisions, tradeoffs, and outcome in a way hiring teams remember.", icon: "book" }
      ],
      bonusSkills: [
        { name: "Accessibility design", keywords: ["accessibility", "a11y", "wcag", "contrast"], description: "Design inclusive experiences with contrast, focus states, and clear language.", icon: "eye" },
        { name: "Design systems", keywords: ["design system", "component library", "tokens"], description: "Create reusable patterns that keep a product consistent as it grows.", icon: "grid" },
        { name: "Motion design", keywords: ["motion", "animation", "microinteraction"], description: "Use movement to clarify state changes rather than decorate the screen.", icon: "zap" }
      ],
      weeks: [
        { title: "Sharpen your design eye", outcome: "A redesigned screen with a clear rationale.", tasks: ["Collect five interfaces you love and annotate one decision in each.", "Redesign a single mobile screen using a strict type and spacing scale.", "Recreate the screen in Figma with components and auto layout."] },
        { title: "Talk to real people", outcome: "Research notes that change one design choice.", tasks: ["Interview two students about a task they find frustrating.", "Write three insights and one assumption you want to test.", "Sketch three distinct flows before choosing a direction."] },
        { title: "Prototype the experience", outcome: "A clickable prototype ready for feedback.", tasks: ["Build a clickable prototype for the main journey.", "Add empty, loading, and error states — not just the happy path.", "Run a five-minute usability test with one person and note what confused them."] },
        { title: "Tell the story", outcome: "A portfolio-ready case study with evidence.", tasks: ["Polish the final screens and document your design tokens.", "Create a before-and-after comparison with three key decisions.", "Publish a case study that includes research, iteration, and one thing you would change."] }
      ],
      project: {
        title: "FlowFix — redesign a frustrating student task",
        description: "Choose a real task students struggle with, such as booking a study room or tracking deadlines. Research it, design a clear flow, test a prototype, and turn the whole journey into a concise case study.",
        difficulty: "Beginner-friendly",
        tags: ["Figma", "User research", "Prototyping", "Case study"],
        coverIcon: "pen",
        blueprint: ["Show three real research notes and one assumption they challenged.", "Include a failed prototype decision — iteration is more convincing than perfection.", "End the case study with measurable next steps you would test."]
      },
      questions: [
        { q: "Walk me through your design process on a recent project.", tip: "Focus on the problem, constraints, decisions, and evidence. Mention what you tried, what you learned, and what you would do differently." },
        { q: "How do you handle feedback that conflicts with your design instinct?", tip: "Show curiosity: ask about the user problem behind the feedback, test assumptions, and separate taste from evidence." },
        { q: "How would you improve a familiar app's onboarding?", tip: "Start with the user's goal and context, identify friction, suggest a testable change, and define what success would look like." }
      ]
    },

    custom: {
      label: "Your custom goal",
      icon: "compass",
      intro: "Your plan starts with clarity, a core tool, and a small piece of evidence. The roadmap is intentionally adaptable so you can shape it around the role you are exploring.",
      skills: [
        { name: "Goal clarity", keywords: ["goal", "research", "career"], description: "Turn a broad ambition into a specific outcome you can test over four weeks.", icon: "target" },
        { name: "Core tool fluency", keywords: ["tool", "software", "technique", "skill"], description: "Get comfortable with the one tool or method that appears most in real job posts.", icon: "sliders" },
        { name: "Project scoping", keywords: ["project", "portfolio", "build"], description: "Choose a small, finishable project that demonstrates the skill you are learning.", icon: "briefcase" },
        { name: "Feedback loops", keywords: ["feedback", "mentor", "review", "community"], description: "Share work early and turn specific feedback into your next iteration.", icon: "refresh" },
        { name: "Clear communication", keywords: ["communicate", "communication", "present", "write"], description: "Explain your process, decisions, and results to people outside your field.", icon: "mic" },
        { name: "Version control", keywords: ["git", "github", "version control"], description: "Keep your work organized and show a visible trail of progress.", icon: "git" }
      ],
      bonusSkills: [
        { name: "Domain vocabulary", keywords: ["vocabulary", "industry", "domain"], description: "Learn the language hiring teams use so your questions and work land faster.", icon: "book" },
        { name: "Portfolio storytelling", keywords: ["portfolio", "case study", "storytelling"], description: "Frame your project around a problem and outcome, not a list of features.", icon: "award" },
        { name: "Interview narrative", keywords: ["interview", "story", "narrative"], description: "Practice a concise story about why this goal matters and what you have done about it.", icon: "mic" }
      ],
      weeks: [
        { title: "Define the destination", outcome: "A clear, testable goal and a shortlist of proof.", tasks: ["Collect three real job descriptions or role examples and highlight repeated skills.", "Write one sentence describing the outcome you want in four weeks.", "Pick the single core skill you will practise first."] },
        { title: "Build the core skill", outcome: "A small piece of work that uses the core skill.", tasks: ["Spend two focused sessions with the best beginner resource you can find.", "Make a tiny deliverable from memory, without following along.", "Ask one person for specific feedback on the result."] },
        { title: "Create your evidence", outcome: "A portfolio-ready project draft.", tasks: ["Scope a project that can be finished in two sessions.", "Build the smallest version that demonstrates the skill.", "Write down the problem, your approach, and one tradeoff."] },
        { title: "Package and practise", outcome: "A published project and a confident story.", tasks: ["Polish the project and add a clear README or case study.", "Prepare a 90-second explanation of what you made and why.", "Practice two interview questions and ask a mentor or peer for feedback."] }
      ],
      project: {
        title: "A portfolio-ready {goal} starter",
        description: "Create one small, finished project that demonstrates your chosen goal. Keep the scope tight: one clear user problem, one core skill, and a short write-up that explains your decisions.",
        difficulty: "Beginner-friendly",
        tags: ["Research", "Core skill", "Portfolio", "Storytelling"],
        coverIcon: "compass",
        blueprint: ["Write a one-sentence problem statement before you start building.", "Share a messy middle version with someone and note what changed.", "Publish the finished piece with a short reflection, not just a screenshot."]
      },
      questions: [
        { q: "Why are you pursuing this goal, and what have you done to explore it?", tip: "Connect a genuine interest to a concrete action. Mention a project, conversation, or experiment that tested your assumption." },
        { q: "Tell me about something you built or completed recently.", tip: "Use situation → action → result. Explain your decisions, the hardest part, and what you would improve next time." },
        { q: "How do you approach learning a new skill quickly?", tip: "Describe how you narrow scope, find a credible source, practise from memory, seek feedback, and measure progress." }
      ]
    }
  };

  const TRACK_MATCHERS = [
    { key: "frontend", terms: ["frontend", "front-end", "web developer", "web dev", "react", "javascript", "ui developer"] },
    { key: "python", terms: ["python", "backend", "back-end", "api developer", "software engineer", "machine learning", "automation"] },
    { key: "data", terms: ["data analyst", "data science", "data scientist", "analytics", "business intelligence", "bi analyst", "data"] },
    { key: "ux", terms: ["designer", "design", "ux", "ui/ux", "product design", "interaction design", "figma"] }
  ];

  /* Current page state. Only this object is persisted to localStorage. */
  const state = {
    goal: "",
    customGoal: "",
    skillsText: "",
    hours: "",
    completedWeeks: 0,
    generatedAt: null
  };

  let currentRole = null;
  let currentDisplayGoal = "";
  let loadingTimers = [];
  let toastTimer = null;
  let scoreFrame = null;
  let storageWarningShown = false;

  /* ---------------------------------------------------------
     Small utilities
     --------------------------------------------------------- */
  const $ = (selector, root = document) => root.querySelector(selector);

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);

  const iconMarkup = (name, extraClass = "") => `<svg class="icon ${extraClass}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const hasKeyword = (text, keyword) => {
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${safe}(?=[^a-z0-9]|$)`, "i").test(text);
  };

  const fillGoal = (text, goalLabel) => String(text).replaceAll("{goal}", goalLabel);

  const formatDuration = (minutes) => {
    const rounded = Math.max(15, Math.round(minutes / 5) * 5);
    if (rounded < 60) return `${rounded} min`;
    const hours = Math.floor(rounded / 60);
    const rest = rounded % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  };

  const formatDate = (timestamp) => new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(timestamp));

  const parseUserSkills = (text) => {
    const trimmed = String(text).trim();
    if (!trimmed || /^(none|n\/a|nothing|no skills|starting fresh|beginner)$/i.test(trimmed)) return [];
    return trimmed
      .split(/[,;\n|•]+/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  const findClosestTrack = (text) => {
    const lower = text.toLowerCase();
    const match = TRACK_MATCHERS.find(({ terms }) => terms.some((term) => lower.includes(term)));
    return match ? match.key : null;
  };

  const resolveRole = () => {
    if (state.goal !== "custom") {
      return { role: GOALS[state.goal], displayGoal: GOALS[state.goal].label, alias: null };
    }
    const custom = state.customGoal.trim() || "Your custom goal";
    const matchedTrack = findClosestTrack(custom);
    if (matchedTrack) {
      return { role: GOALS[matchedTrack], displayGoal: custom, alias: GOALS[matchedTrack].label };
    }
    return { role: GOALS.custom, displayGoal: custom, alias: null };
  };

  const analyzeSkills = (role) => {
    const text = state.skillsText.toLowerCase();
    const startingFresh = !text.trim() || /^(none|n\/a|nothing|no skills|starting fresh|beginner)$/i.test(text.trim());
    const matched = startingFresh ? [] : role.skills.filter((skill) => skill.keywords.some((keyword) => hasKeyword(text, keyword)));
    const matchedBonus = startingFresh ? [] : role.bonusSkills.filter((skill) => skill.keywords.some((keyword) => hasKeyword(text, keyword)));
    const gaps = role.skills.filter((skill) => !matched.includes(skill));
    const extraGaps = role.bonusSkills.filter((skill) => !matchedBonus.includes(skill));
    const suggestions = [...gaps, ...extraGaps].slice(0, 3);
    return { matched, matchedBonus, gaps, suggestions };
  };

  const calculateScore = (analysis, hours) => {
    const coverage = analysis.matched.length / currentRole.skills.length;
    const hoursBoost = hours === 10 ? 7 : hours === 5 ? 4 : 1;
    return clamp(Math.round(18 + coverage * 58 + analysis.matchedBonus.length * 3 + hoursBoost), 20, 97);
  };

  /* ---------------------------------------------------------
     DOM references
     --------------------------------------------------------- */
  const els = {
    header: $("#site-header"),
    navToggle: $("#navToggle"),
    navMenu: $("#primary-menu"),
    form: $("#planForm"),
    careerGoal: $("#careerGoal"),
    customGoalWrap: $("#customGoalWrap"),
    customGoal: $("#customGoal"),
    skills: $("#skills"),
    studyTime: $("#studyTime"),
    generateBtn: $("#generateBtn"),
    generateLabel: $(".generate-label"),
    formStatus: $("#formStatus"),
    builder: $("#builder"),
    dashboard: $("#dashboard"),
    dashboardEmpty: $("#dashboardEmpty"),
    dashboardLoading: $("#dashboardLoading"),
    dashboardContent: $("#dashboardContent"),
    loadingMessage: $("#loadingMessage"),
    resultTitle: $("#resultTitle"),
    resultSubtitle: $("#resultSubtitle"),
    resultDate: $("#resultDate"),
    resultTrackNote: $("#resultTrackNote"),
    startOverBtn: $("#startOverBtn"),
    scoreRing: $("#scoreRing"),
    scoreRingFill: $("#scoreRingFill"),
    scoreValue: $("#scoreValue"),
    matchHeadline: $("#matchHeadline"),
    scoreCopy: $("#scoreCopy"),
    startingSkills: $("#startingSkills"),
    currentWeekLabel: $("#currentWeekLabel"),
    paceLabel: $("#paceLabel"),
    progressBig: $("#progressBig"),
    journeyProgress: $("#journeyProgress"),
    journeyBar: $("#journeyBar"),
    weekDots: $("#weekDots"),
    completeWeekBtn: $("#completeWeekBtn"),
    completeWeekText: $("#completeWeekText"),
    completeHint: $("#completeHint"),
    progressAnnouncement: $("#progressAnnouncement"),
    completionPill: $("#completionPill"),
    planPace: $("#planPace"),
    roadmapGrid: $("#roadmapGrid"),
    roadmapTip: $("#roadmapTip"),
    skillsGrid: $("#skillsGrid"),
    projectCover: $("#projectCover"),
    projectCoverIcon: $("#projectCoverIcon use"),
    projectDifficulty: $("#projectDifficulty"),
    projectTitle: $("#projectTitle"),
    projectDescription: $("#projectDescription"),
    projectTags: $("#projectTags"),
    projectBlueprint: $("#projectBlueprint"),
    questionList: $("#questionList"),
    toast: $("#toast"),
    copyrightYear: $("#copyrightYear")
  };

  /* ---------------------------------------------------------
     Toasts, storage and scrolling
     --------------------------------------------------------- */
  function showToast(message, type = "success") {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast is-visible${type === "error" ? " is-error" : ""}`;
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 3600);
  }

  function savePlan() {
    if (!state.generatedAt) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }));
    } catch (error) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showToast("This browser blocked local storage. Your plan will work, but may not survive a refresh.", "error");
      }
    }
  }

  function scrollToElement(element) {
    if (!element) return;
    element.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }

  /* ---------------------------------------------------------
     Form validation
     --------------------------------------------------------- */
  function getFieldElement(name) {
    if (name === "customGoal") return els.customGoalWrap;
    return els.form.querySelector(`[data-field="${name}"]`);
  }

  function getInputElement(name) {
    return { careerGoal: els.careerGoal, customGoal: els.customGoal, skills: els.skills, studyTime: els.studyTime }[name];
  }

  function setFieldError(name, message) {
    const field = getFieldElement(name);
    const input = getInputElement(name);
    const error = $(`#${name}-error`);
    if (!field || !input || !error) return;
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
  }

  function clearFieldError(name) {
    const field = getFieldElement(name);
    const input = getInputElement(name);
    const error = $(`#${name}-error`);
    if (field) field.classList.remove("has-error");
    if (input) input.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function clearAllErrors() {
    ["careerGoal", "customGoal", "skills", "studyTime"].forEach(clearFieldError);
  }

  function toggleCustomGoal() {
    const isCustom = els.careerGoal.value === "custom";
    els.customGoalWrap.hidden = !isCustom;
    els.customGoal.required = isCustom;
    if (!isCustom) clearFieldError("customGoal");
  }

  function validateForm() {
    clearAllErrors();
    const errors = {};
    const goal = els.careerGoal.value;
    const custom = els.customGoal.value.trim();
    const skills = els.skills.value.trim();
    const hours = els.studyTime.value;

    if (!goal) {
      errors.careerGoal = "Choose the path you want to explore first.";
    }
    if (goal === "custom" && custom.length < 2) {
      errors.customGoal = "Add a role or goal so we know what to personalize.";
    }
    if (!skills) {
      errors.skills = "Add at least one skill, or type “none” if you are starting fresh.";
    } else if (skills.length < 2) {
      errors.skills = "Add a little more detail — even one short skill name works.";
    }
    if (!hours) {
      errors.studyTime = "Choose a weekly pace that feels realistic.";
    }

    const errorKeys = Object.keys(errors);
    if (errorKeys.length) {
      errorKeys.forEach((key) => setFieldError(key, errors[key]));
      els.formStatus.textContent = "Please finish the highlighted fields and try again.";
      els.formStatus.classList.add("is-error");
      const firstInput = getInputElement(errorKeys[0]);
      if (firstInput) firstInput.focus();
      return false;
    }

    els.formStatus.textContent = "";
    els.formStatus.classList.remove("is-error");
    return true;
  }

  /* ---------------------------------------------------------
     Rendering the personalized dashboard
     --------------------------------------------------------- */
  function renderStartingSkills(analysis) {
    const rawSkills = parseUserSkills(state.skillsText);
    if (!rawSkills.length) {
      els.startingSkills.innerHTML = `<span class="skill-chip is-fresh">Starting fresh — a great place to begin.</span>`;
      return;
    }
    const shown = rawSkills.slice(0, 5);
    els.startingSkills.innerHTML = shown.map((skill) => `<span class="skill-chip">${escapeHTML(skill)}</span>`).join("");
    if (rawSkills.length > 5) {
      els.startingSkills.insertAdjacentHTML("beforeend", `<span class="skill-chip">+${rawSkills.length - 5} more</span>`);
    }
  }

  function renderSkills(suggestions) {
    els.skillsGrid.innerHTML = suggestions.map((skill, index) => `
      <article class="skill-card">
        <div class="skill-card-top">
          <span class="skill-icon">${iconMarkup(skill.icon)}</span>
          <span class="priority-tag">Focus 0${index + 1}</span>
        </div>
        <h4>${escapeHTML(skill.name)}</h4>
        <p>${escapeHTML(skill.description)}</p>
        <span class="skill-week">${iconMarkup("target")}Start in week ${index + 1}</span>
      </article>
    `).join("");
  }

  function renderRoadmap() {
    if (!currentRole) return;
    const hours = Number(state.hours);
    const weights = [0.4, 0.35, 0.25];
    els.roadmapGrid.innerHTML = currentRole.weeks.map((week, index) => {
      const isComplete = index < state.completedWeeks;
      const isCurrent = index === state.completedWeeks && state.completedWeeks < PLAN_WEEKS;
      const statusClass = isComplete ? "is-complete" : isCurrent ? "is-current" : "is-upcoming";
      const statusLabel = isComplete ? "Done" : isCurrent ? "In focus" : "Up next";
      const statusIcon = isComplete ? iconMarkup("check") : "";
      const taskMarkup = week.tasks.map((task, taskIndex) => {
        const checkContent = isComplete ? iconMarkup("check") : String(taskIndex + 1);
        return `
          <li class="week-task">
            <span class="task-check">${checkContent}</span>
            <span>
              <span>${escapeHTML(task)}</span>
              <span class="task-time">${isComplete ? "Completed" : formatDuration(hours * 60 * weights[taskIndex])}</span>
            </span>
          </li>`;
      }).join("");
      return `
        <article class="week-card ${statusClass}" data-week="${index + 1}"${isCurrent ? ' aria-current="step"' : ""}>
          <div class="week-card-head">
            <span class="week-index">Week ${String(index + 1).padStart(2, "0")}</span>
            <span class="week-status">${statusIcon}${statusLabel}</span>
          </div>
          <h4>${escapeHTML(week.title)}</h4>
          <ul class="week-tasks">${taskMarkup}</ul>
          <p class="week-outcome">${iconMarkup(isComplete ? "check" : "target")}<span>${escapeHTML(week.outcome)}</span></p>
        </article>`;
    }).join("");
  }

  function updateProgressUI() {
    const completed = clamp(Number(state.completedWeeks) || 0, 0, PLAN_WEEKS);
    const percent = Math.round((completed / PLAN_WEEKS) * 100);
    const complete = completed >= PLAN_WEEKS;

    els.progressBig.textContent = `${percent}%`;
    els.journeyBar.style.width = `${percent}%`;
    els.journeyProgress.setAttribute("aria-valuenow", String(percent));
    els.currentWeekLabel.textContent = complete ? "Plan complete" : `Week ${completed + 1} of 4`;
    els.completionPill.textContent = `${completed} / ${PLAN_WEEKS} weeks`;
    els.planPace.textContent = `Paced for ${state.hours} hours per week.`;

    Array.from(els.weekDots.children).forEach((dot, index) => {
      dot.classList.toggle("is-complete", index < completed);
      dot.classList.toggle("is-current", index === completed && !complete);
    });

    els.completeWeekBtn.disabled = complete;
    els.completeWeekBtn.classList.toggle("is-success", complete);
    els.completeWeekText.textContent = complete ? "All 4 weeks complete" : `Mark week ${completed + 1} complete`;

    if (complete) {
      els.completeHint.textContent = "Incredible work. Next move: publish the project and rehearse your interview story.";
    } else if (completed === 0) {
      els.completeHint.textContent = "One small step today keeps the momentum going.";
    } else if (completed === 1) {
      els.completeHint.textContent = "First week done. The hardest part is starting — you are past it.";
    } else if (completed === 2) {
      els.completeHint.textContent = "Halfway there. Keep the streak going while the ideas are fresh.";
    } else {
      els.completeHint.textContent = "One week left. Finish strong and make the work visible.";
    }
  }

  function renderProject(role, displayGoal) {
    const project = role.project;
    els.projectTitle.textContent = fillGoal(project.title, displayGoal);
    els.projectDescription.textContent = fillGoal(project.description, displayGoal);
    els.projectDifficulty.textContent = project.difficulty;
    els.projectTags.innerHTML = project.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    els.projectBlueprint.innerHTML = project.blueprint.map((step) => `<li>${escapeHTML(fillGoal(step, displayGoal))}</li>`).join("");
    if (els.projectCoverIcon) els.projectCoverIcon.setAttribute("href", `#i-${project.coverIcon || role.icon}`);
  }

  function renderQuestions(role) {
    els.questionList.innerHTML = role.questions.map((question, index) => `
      <details class="question-item">
        <summary>
          <span class="question-number">${String(index + 1).padStart(2, "0")}</span>
          <span>${escapeHTML(question.q)}</span>
        </summary>
        <div class="answer-tip">
          <strong>What a strong answer includes</strong>
          <p>${escapeHTML(question.tip)}</p>
        </div>
      </details>
    `).join("");
  }

  function animateScore(score) {
    if (!els.scoreRingFill || !els.scoreValue) return;
    window.cancelAnimationFrame(scoreFrame);
    els.scoreRingFill.style.strokeDashoffset = String(CIRCUMFERENCE);
    els.scoreValue.textContent = "0";
    els.scoreRing.setAttribute("aria-label", `Demo skill match score: ${score} out of 100`);

    if (prefersReducedMotion.matches) {
      els.scoreRingFill.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - score / 100));
      els.scoreValue.textContent = String(score);
      return;
    }

    const start = performance.now();
    const duration = 950;
    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      els.scoreValue.textContent = String(Math.round(score * eased));
      els.scoreRingFill.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - (score * eased) / 100));
      if (progress < 1) scoreFrame = window.requestAnimationFrame(tick);
    };
    scoreFrame = window.requestAnimationFrame(tick);
  }

  function renderDashboard() {
    const resolved = resolveRole();
    currentRole = resolved.role;
    currentDisplayGoal = resolved.displayGoal;
    const analysis = analyzeSkills(currentRole);
    const hours = Number(state.hours);
    const score = calculateScore(analysis, hours);
    const matchedCount = analysis.matched.length;
    const totalSkills = currentRole.skills.length;

    els.resultTitle.innerHTML = `Your <span class="text-gradient">${escapeHTML(currentDisplayGoal)}</span> path is ready.`;
    els.resultSubtitle.textContent = resolved.alias
      ? `We adapted our ${resolved.alias} demo track for “${currentDisplayGoal}”. ${currentRole.intro}`
      : currentRole.intro;
    els.resultDate.textContent = formatDate(state.generatedAt || Date.now());
    els.resultTrackNote.textContent = resolved.alias ? `Closest demo track: ${resolved.alias}` : "";

    if (matchedCount === 0) {
      els.matchHeadline.textContent = "A fresh start is a real advantage.";
      els.scoreCopy.textContent = `You are beginning with a clean slate. Your demo plan starts with the fundamentals and builds toward a finished piece of proof at ${hours} hours a week.`;
    } else if (matchedCount < totalSkills / 2) {
      els.matchHeadline.textContent = "You have more momentum than you think.";
      els.scoreCopy.textContent = `You already show ${matchedCount} of ${totalSkills} core signals for this goal. The plan prioritises the three gaps with the biggest payoff at ${hours} hours a week.`;
    } else if (matchedCount < totalSkills) {
      els.matchHeadline.textContent = "A solid foundation to build on.";
      els.scoreCopy.textContent = `You already match ${matchedCount} of ${totalSkills} core skills. The demo plan turns that base into a portfolio-ready project and a clearer interview story.`;
    } else {
      els.matchHeadline.textContent = "You are closer than the job post makes it feel.";
      els.scoreCopy.textContent = "You already cover every core signal we check. Now the plan focuses on proof, polish, and the confidence to talk about your work.";
    }

    els.paceLabel.textContent = `${hours} hrs / week`;
    renderStartingSkills(analysis);
    renderSkills(analysis.suggestions);
    renderRoadmap();
    updateProgressUI();
    renderProject(currentRole, currentDisplayGoal);
    renderQuestions(currentRole);
    animateScore(score);
    savePlan();
  }

  function showDashboard() {
    els.dashboardEmpty.hidden = true;
    els.dashboardLoading.hidden = true;
    els.dashboardContent.hidden = false;
    els.dashboard.removeAttribute("aria-busy");
    els.resultTitle.tabIndex = -1;
  }

  function showEmptyDashboard() {
    els.dashboardEmpty.hidden = false;
    els.dashboardLoading.hidden = true;
    els.dashboardContent.hidden = true;
    els.dashboard.removeAttribute("aria-busy");
  }

  /* ---------------------------------------------------------
     Generation flow
     --------------------------------------------------------- */
  function clearLoadingTimers() {
    loadingTimers.forEach((timer) => window.clearTimeout(timer));
    loadingTimers = [];
  }

  function setGenerating(active) {
    els.generateBtn.disabled = active;
    els.generateBtn.classList.toggle("is-loading", active);
    els.generateBtn.setAttribute("aria-busy", String(active));
    els.generateLabel.textContent = active ? "Building your bridge…" : "Generate my plan";
  }

  function startGeneration() {
    clearLoadingTimers();
    setGenerating(true);
    els.formStatus.textContent = "Reading your starting point and mapping a plan…";
    els.formStatus.classList.remove("is-error");
    els.dashboardEmpty.hidden = true;
    els.dashboardContent.hidden = true;
    els.dashboardLoading.hidden = false;
    els.dashboard.setAttribute("aria-busy", "true");
    els.loadingMessage.textContent = "Reading your starting point.";
    scrollToElement(els.dashboard);

    const messages = [
      "Scanning the demo skill library for your fastest path.",
      "Choosing the three gaps with the biggest payoff.",
      "Matching a portfolio project and interview questions."
    ];
    messages.forEach((message, index) => {
      loadingTimers.push(window.setTimeout(() => {
        els.loadingMessage.textContent = message;
      }, 300 + index * 280));
    });

    const duration = prefersReducedMotion.matches ? 550 : 1280;
    loadingTimers.push(window.setTimeout(() => {
      state.generatedAt = Date.now();
      state.completedWeeks = 0;
      renderDashboard();
      showDashboard();
      setGenerating(false);
      els.formStatus.textContent = "Your demo plan is ready below.";
      els.formStatus.classList.remove("is-error");
      showToast("Your personalized demo plan is ready.");
      els.resultTitle.focus({ preventScroll: true });
    }, duration));
  }

  function syncStateFromForm() {
    state.goal = els.careerGoal.value;
    state.customGoal = els.customGoal.value.trim();
    state.skillsText = els.skills.value.trim();
    state.hours = els.studyTime.value;
  }

  function resetSession() {
    clearLoadingTimers();
    window.cancelAnimationFrame(scoreFrame);
    state.goal = "";
    state.customGoal = "";
    state.skillsText = "";
    state.hours = "";
    state.completedWeeks = 0;
    state.generatedAt = null;
    currentRole = null;
    currentDisplayGoal = "";

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* The interface still resets even when storage is unavailable. */
    }

    els.form.reset();
    els.customGoal.required = false;
    clearAllErrors();
    setGenerating(false);
    toggleCustomGoal();
    showEmptyDashboard();
    els.formStatus.textContent = "Plan cleared. A fresh start is ready when you are.";
    els.formStatus.classList.remove("is-error");
    els.progressAnnouncement.textContent = "";
    scrollToElement(els.builder);
    window.setTimeout(() => {
      els.careerGoal.focus({ preventScroll: true });
    }, prefersReducedMotion.matches ? 0 : 420);
    showToast("Your plan has been cleared. Ready for a fresh start.");
  }

  function markWeekComplete() {
    if (!currentRole || state.completedWeeks >= PLAN_WEEKS) return;
    state.completedWeeks = clamp(state.completedWeeks + 1, 0, PLAN_WEEKS);
    renderRoadmap();
    updateProgressUI();
    savePlan();
    const message = state.completedWeeks === PLAN_WEEKS
      ? "All four weeks are complete. Start polishing your project and interview story."
      : `Week ${state.completedWeeks} marked complete. You are ${state.completedWeeks * 25}% through the roadmap.`;
    els.progressAnnouncement.textContent = message;
    showToast(message);
  }

  /* ---------------------------------------------------------
     Saved progress
     --------------------------------------------------------- */
  function restoreSavedPlan() {
    let saved;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      saved = JSON.parse(raw);
    } catch (error) {
      return false;
    }

    if (!saved || saved.version !== 1 || !saved.state) return false;
    const stored = saved.state;
    if (!Object.prototype.hasOwnProperty.call(GOALS, stored.goal)) return false;
    if (!["2", "5", "10"].includes(String(stored.hours))) return false;
    if (typeof stored.skillsText !== "string" || !stored.skillsText.trim()) return false;
    if (stored.goal === "custom" && (typeof stored.customGoal !== "string" || !stored.customGoal.trim())) return false;

    state.goal = stored.goal;
    state.customGoal = typeof stored.customGoal === "string" ? stored.customGoal : "";
    state.skillsText = stored.skillsText;
    state.hours = String(stored.hours);
    state.completedWeeks = clamp(Number(stored.completedWeeks) || 0, 0, PLAN_WEEKS);
    state.generatedAt = Number.isFinite(Number(stored.generatedAt)) ? Number(stored.generatedAt) : Date.now();

    els.careerGoal.value = state.goal;
    els.customGoal.value = state.customGoal;
    els.skills.value = state.skillsText;
    els.studyTime.value = state.hours;
    toggleCustomGoal();

    renderDashboard();
    showDashboard();
    els.formStatus.textContent = "Your saved plan and progress were restored below.";
    els.formStatus.classList.remove("is-error");
    return true;
  }

  /* ---------------------------------------------------------
     Navigation, reveals, and general page behavior
     --------------------------------------------------------- */
  function setMobileMenu(open) {
    if (!els.navToggle || !els.navMenu) return;
    els.navToggle.setAttribute("aria-expanded", String(open));
    els.navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    els.navMenu.classList.toggle("is-open", open);
  }

  function setupNavigation() {
    if (!els.navToggle) return;
    els.navToggle.addEventListener("click", () => {
      setMobileMenu(els.navToggle.getAttribute("aria-expanded") !== "true");
    });
    els.navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMobileMenu(false);
    });
    document.addEventListener("click", (event) => {
      if (els.navToggle.getAttribute("aria-expanded") === "true" && !els.header.contains(event.target)) {
        setMobileMenu(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && els.navToggle.getAttribute("aria-expanded") === "true") {
        setMobileMenu(false);
        els.navToggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) setMobileMenu(false);
    });

    const updateHeader = () => els.header.classList.toggle("is-scrolled", window.scrollY > 14);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function setupReveals() {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) return;
    items.forEach((item) => item.classList.add("js-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
    items.forEach((item) => observer.observe(item));
  }

  function setupGoalLinks() {
    document.querySelectorAll("[data-goal-cta]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        setMobileMenu(false);
        scrollToElement(els.builder);
        window.setTimeout(() => {
          els.careerGoal.focus({ preventScroll: true });
        }, prefersReducedMotion.matches ? 0 : 520);
      });
    });
  }

  function setupFormEvents() {
    els.form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm()) return;
      syncStateFromForm();
      startGeneration();
    });

    els.careerGoal.addEventListener("change", () => {
      clearFieldError("careerGoal");
      toggleCustomGoal();
      if (els.careerGoal.value === "custom") {
        window.setTimeout(() => els.customGoal.focus({ preventScroll: true }), 40);
      }
    });

    [els.customGoal, els.skills].forEach((input) => {
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") clearFieldError(input.id);
      });
    });

    els.studyTime.addEventListener("change", () => {
      if (els.studyTime.getAttribute("aria-invalid") === "true") clearFieldError("studyTime");
    });

    els.startOverBtn.addEventListener("click", resetSession);
    els.completeWeekBtn.addEventListener("click", markWeekComplete);
  }

  /* ---------------------------------------------------------
     Initialize
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     Auth state in header
     --------------------------------------------------------- */
  async function syncAuthHeader() {
    const navLogin = document.getElementById("navLoginLink");
    const navSignup = document.getElementById("navSignupLink");
    const navUser = document.getElementById("navUser");
    const navUserName = document.getElementById("navUserName");
    const navLogout = document.getElementById("navLogoutBtn");
    if (!navLogin && !navSignup && !navUser) return;

    try {
      const res = await fetch("/api/me", { credentials: "same-origin" });
      const data = await res.json().catch(() => null);
      const user = data?.ok ? data.user : null;
      if (user) {
        if (navLogin) navLogin.hidden = true;
        if (navSignup) navSignup.hidden = true;
        if (navUser) {
          navUser.hidden = false;
          if (navUserName) navUserName.textContent = user.name.split(" ")[0];
        }
      } else {
        if (navLogin) navLogin.hidden = false;
        if (navSignup) navSignup.hidden = false;
        if (navUser) navUser.hidden = true;
      }
      if (navLogout) {
        navLogout.onclick = async () => {
          try {
            await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
          } catch {}
          window.location.reload();
        };
      }
    } catch {
      // Ignore auth sync failures in static/demo context.
    }
  }

  /* ---------------------------------------------------------
     AI Assistant
     --------------------------------------------------------- */
  function setupAssistant() {
    const btn = document.getElementById("aiAssistantBtn");
    const panel = document.getElementById("aiAssistantPanel");
    const close = document.getElementById("aiAssistantClose");
    const form = document.getElementById("aiAssistantForm");
    const input = document.getElementById("aiAssistantInput");
    const body = document.getElementById("aiAssistantBody");
    const typing = document.getElementById("aiAssistantTyping");
    if (!btn || !panel) return;

    const replies = [
      "Focus on one small task for 10 minutes. Momentum beats perfection.",
      "Try building your portfolio project first — it's the thing you'll actually talk about.",
      "Practice your answer out loud. Clarity comes from speaking, not just writing.",
      "Pick just one skill to master this week. Depth now saves time later.",
      "Don't wait to be 'ready'. Ship something tiny and iterate."
    ];

    function openPanel() {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add("is-open"));
      btn.setAttribute("aria-expanded", "true");
      setTimeout(() => input?.focus(), 280);
    }

    function closePanel() {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      setTimeout(() => { if (!panel.classList.contains("is-open")) panel.hidden = true; }, 280);
    }

    btn.addEventListener("click", () => {
      if (panel.classList.contains("is-open")) closePanel();
      else openPanel();
    });
    close?.addEventListener("click", closePanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const userMsg = document.createElement("div");
      userMsg.className = "ai-message ai-message--user";
      userMsg.innerHTML = `<div class="ai-message-bubble" style="margin-left:auto;border-radius:16px 16px 6px 16px;background:rgba(59,130,246,0.18);border-color:rgba(96,165,250,0.4);"><p>${text.replace(/[<>]/g, "")}</p></div>`;
      body.appendChild(userMsg);
      input.value = "";
      body.scrollTop = body.scrollHeight;
      if (typing) {
        typing.hidden = false;
        body.scrollTop = body.scrollHeight;
      }
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const delay = prefersReducedMotion.matches ? 200 : 900;
      setTimeout(() => {
        if (typing) typing.hidden = true;
        const botMsg = document.createElement("div");
        botMsg.className = "ai-message ai-message--bot";
        botMsg.innerHTML = `<div class="ai-message-avatar"><svg class="icon"><use href="#i-sparkles"></use></svg></div><div class="ai-message-bubble"><p>${reply}</p></div>`;
        body.appendChild(botMsg);
        body.scrollTop = body.scrollHeight;
      }, delay);
    });
  }

  function init() {
    if (els.copyrightYear) els.copyrightYear.textContent = String(new Date().getFullYear());
    setupNavigation();
    setupReveals();
    setupGoalLinks();
    setupFormEvents();
    toggleCustomGoal();
    restoreSavedPlan();
    syncAuthHeader();
    setupAssistant();
  }

  init();
})();


