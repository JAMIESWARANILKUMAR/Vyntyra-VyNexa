// Centralized SEO & GEO (Generative Engine Optimization) Metadata Configuration
// Intent Modifier (A) | Core Service (B) | Technology / Stack (C) | Geographic Target (D)

export interface SeoKeywordMatrixItem {
  id: number;
  intent: string;
  service: string;
  stack: string;
  targetRegion: string;
}

export const SEO_KEYWORD_MATRIX: SeoKeywordMatrixItem[] = [
  { id: 951, intent: "Best / Top rated", service: "Custom Web Application", stack: "Next.js / React", targetRegion: "United States" },
  { id: 952, intent: "Hire Dedicated", service: "Mobile App Development", stack: "Flutter / React Native", targetRegion: "United Kingdom" },
  { id: 953, intent: "Enterprise", service: "AI & LLM Integration", stack: "Python / LangChain", targetRegion: "UAE / Dubai" },
  { id: 954, intent: "Scalable", service: "Cloud & DevOps Consulting", stack: "AWS / Kubernetes", targetRegion: "Singapore" },
  { id: 955, intent: "Offshore Partner", service: "Microservices Architecture", stack: "Node.js / Docker", targetRegion: "Canada" },
  { id: 956, intent: "Affordable", service: "MVP Development Firm", stack: "MERN Stack", targetRegion: "Australia" },
  { id: 957, intent: "Fractional CTO", service: "Product Modernization", stack: "Cloud Native", targetRegion: "Germany" },
  { id: 958, intent: "B2B Agency", service: "SaaS Development", stack: "Serverless APIs", targetRegion: "Global / Remote" },
];

export const CATEGORIZED_SEO_KEYWORDS = {
  // 1. Careers, Domain-Based Jobs & Talent Acquisition
  careersAndTalent: [
    "vyntyra careers full stack developer",
    "mern stack developer jobs vyntyra consultancy services",
    "hire next js react developer remote india",
    "senior node js backend engineer openings",
    "python django fast api developer careers",
    "microservices backend engineer remote jobs",
    "database administrator postgresql mongodb jobs",
    "graphql rest api engineer hiring",
    "ai engineer jobs vyntyra consultancy services",
    "machine learning engineer openings python pytorch",
    "generative ai prompt engineer careers",
    "llm integration engineer remote jobs",
    "nlp computer vision developer openings",
    "data scientist predictive modeling careers",
    "flutter app developer jobs vyntyra",
    "react native mobile engineer careers",
    "ui ux product designer jobs figma",
    "lead ui designer design systems openings",
    "qa automation test engineer selenium cypress jobs",
    "devops cloud engineer aws kubernetes careers",
    "it business development manager jobs vyntyra",
    "technical project manager b2b saas openings",
    "it consultant digital transformation careers",
    "technical sales representative enterprise it services",
  ],

  // 2. Internships, Mentorship & Student Training Programs
  internshipsAndMentorship: [
    "vyntyra consultancy services internship application",
    "web development internship with live projects vyntyra",
    "full stack mern stack virtual internship with certificate",
    "ai and machine learning summer internship vyntyra",
    "generative ai and llm training internship for students",
    "python data science virtual internship with lor",
    "ui ux design internship figma real world projects",
    "flutter mobile app development student internship",
    "cloud devops docker aws practical training internship",
    "btech cse summer industrial training internship",
    "remote software engineering internship for college students",
    "tech mentorship and campus ambassador program vyntyra",
  ],

  // 3. Web Development, Modern Frameworks & Web Apps
  webDevelopment: [
    "custom web application development vyntyra consultancy services",
    "enterprise next js web development company",
    "hire dedicated react js front end developers",
    "progressive web app pwa development services",
    "single page application spa engineering firm",
    "custom modern web portal development agency",
    "tailwind css responsive web application development",
    "scalable web backend architecture node js express",
    "headless cms development strapi sanity netlify",
    "core web vitals page speed optimization services",
    "legacy web portal modernization and refactoring",
    "secure web app development with bot protection",
  ],

  // 4. Web Design, UI/UX Design & Design Systems
  webDesignAndUiUx: [
    "b2b saas ui ux product design agency",
    "custom enterprise web design vyntyra consultancy services",
    "figma interactive prototyping and wireframing services",
    "conversion rate optimized cro landing page design",
    "scalable design system creation for tech startups",
    "mobile app user journey mapping and wireframes",
    "user research and usability testing consulting",
    "modern dark mode responsive dashboard ui design",
    "brand identity design and vector graphics firm",
    "design to clean react code frontend development",
  ],

  // 5. Custom Software & Enterprise Architecture
  customSoftwareAndArchitecture: [
    "bespoke custom software development services",
    "enterprise software solutions vyntyra consultancy services",
    "microservices backend system architecture consulting",
    "custom business workflow automation software",
    "secure enterprise rest api and graphql development",
    "database query optimization and sharding services",
    "cloud native software engineering aws gcp azure",
    "owasp compliant software security audit and encryption",
    "multi tenant architecture design for enterprise",
    "legacy software migration to modern cloud stack",
  ],

  // 6. CRM & ERP Solutions (Custom & Integration)
  crmAndErpSolutions: [
    "custom crm software development company",
    "enterprise erp system implementation services",
    "cloud based crm software for small business and msme",
    "custom sales pipeline and lead management crm",
    "b2b client relationship management portal engineering",
    "custom erp development for manufacturing and supply chain",
    "hospital and clinic management erp development",
    "educational institute and university erp system",
    "custom billing invoicing and accounting erp modules",
    "hrms payroll and employee management software development",
    "crm integration with whatsapp api and email automation",
    "enterprise inventory and warehouse management software",
  ],

  // 7. SaaS Architecture & Product Engineering
  saasArchitectureAndEngineering: [
    "b2b saas product engineering company vyntyra",
    "multi tenant saas platform development services",
    "saas mvp development agency for seed stage startups",
    "stripe payment gateway and recurring subscription billing setup",
    "saas role based access control rbac system design",
    "micro saas software development and rapid deployment",
    "ai powered saas application development company",
    "scalable multi cloud saas infrastructure setup",
    "saas customer onboarding automation and telemetry",
    "white label b2b software platform development",
  ],

  // 8. Mobile App Development (iOS, Android & Cross-Platform)
  mobileAppDevelopment: [
    "cross platform mobile app development vyntyra consultancy services",
    "hire flutter mobile app developers for startups",
    "react native enterprise mobile app development firm",
    "native android app development kotlin jetpack compose",
    "native ios mobile application development swift",
    "offline first mobile database sync architecture",
    "mobile biometric authentication and security integration",
    "in app purchases and mobile payment gateway integration",
    "push notification backend architecture firebase fcm",
    "ecommerce and on demand booking mobile app development",
  ],
};

export const ALL_CATEGORIZED_KEYWORDS = Object.values(CATEGORIZED_SEO_KEYWORDS).flat();

export const FORMATTED_SEO_KEYWORDS = [
  // Exact Matrix Combinations (951 - 958)
  "Best Top rated Custom Web Application Next.js React United States",
  "Hire Dedicated Mobile App Development Flutter React Native United Kingdom",
  "Enterprise AI LLM Integration Python LangChain UAE Dubai",
  "Scalable Cloud DevOps Consulting AWS Kubernetes Singapore",
  "Offshore Partner Microservices Architecture Node.js Docker Canada",
  "Affordable MVP Development Firm MERN Stack Australia",
  "Fractional CTO Product Modernization Cloud Native Germany",
  "B2B Agency SaaS Development Serverless APIs Global Remote",

  // Short-tail variations
  "Best Custom Web Application Development US Next.js React",
  "Hire Dedicated Flutter Developers United Kingdom UK",
  "Enterprise AI Integration Python LangChain Dubai UAE",
  "Scalable AWS Kubernetes Cloud Consulting Singapore",
  "Offshore Microservices Architecture Partner Node.js Docker Canada",
  "Affordable MERN Stack MVP Development Firm Australia",
  "Fractional CTO Services Germany Cloud Native",
  "B2B SaaS Development Agency Serverless APIs Global",

  // Core Service Categories (1-8)
  ...ALL_CATEGORIZED_KEYWORDS,
];

export const GLOBAL_SEO_META_TAGS = [
  { name: "keywords", content: FORMATTED_SEO_KEYWORDS.join(", ") },
  { name: "geo.region", content: "US, GB, AE-DU, SG, CA, AU, DE, IN" },
  { name: "geo.placename", content: "United States, United Kingdom, Dubai UAE, Singapore, Canada, Australia, Germany, Global" },
  { name: "geo.position", content: "25.2048;55.2708" },
  { name: "ICBM", content: "25.2048, 55.2708" },
  { name: "target-audience", content: "Global Enterprises, Startups, CTOs, Engineering Leaders, Students & Job Seekers" },
  { name: "coverage", content: "Worldwide" },
  { name: "distribution", content: "Global" },
];

export const SCHEMA_ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://vyntyra.com/#organization",
      "name": "Vyntyra Consultancy Services — Project VyNexa",
      "url": "https://vyntyra.com",
      "logo": "https://vyntyra.com/icon-512.png",
      "description": "Global enterprise software engineering firm & talent accelerator. Specializing in Custom Web & Mobile Apps, AI & LLM Solutions, SaaS Architecture, CRM/ERP Solutions, Cloud & DevOps, Careers & Tech Internships across US, UK, UAE/Dubai, Singapore, Canada, Australia, Germany, and Global.",
      "areaServed": [
        { "@type": "Country", "name": "United States" },
        { "@type": "Country", "name": "United Kingdom" },
        { "@type": "Place", "name": "UAE / Dubai" },
        { "@type": "Country", "name": "Singapore" },
        { "@type": "Country", "name": "Canada" },
        { "@type": "Country", "name": "Australia" },
        { "@type": "Country", "name": "Germany" },
        { "@type": "Place", "name": "Global / Remote" }
      ],
      "knowsAbout": [
        ...SEO_KEYWORD_MATRIX.map(item => `${item.intent} ${item.service} (${item.stack}) - ${item.targetRegion}`),
        ...ALL_CATEGORIZED_KEYWORDS
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Global Software Engineering, AI, SaaS & Talent Ecosystem",
        "itemListElement": [
          ...SEO_KEYWORD_MATRIX.map((item, index) => ({
            "@type": "Offer",
            "position": index + 1,
            "itemOffered": {
              "@type": "Service",
              "name": `${item.intent} ${item.service}`,
              "category": item.service,
              "areaServed": item.targetRegion,
              "description": `${item.intent} ${item.service} services built with ${item.stack} targeting ${item.targetRegion}.`
            }
          })),
          {
            "@type": "Offer",
            "position": 9,
            "itemOffered": {
              "@type": "Service",
              "name": "Careers & Domain-Based Job Opportunities",
              "category": "Talent Acquisition",
              "description": "Full-Stack, Backend, AI/ML, Mobile, UI/UX, QA, DevOps, and BD roles."
            }
          },
          {
            "@type": "Offer",
            "position": 10,
            "itemOffered": {
              "@type": "Service",
              "name": "Internships, Mentorship & Student Training Programs",
              "category": "Education & Mentorship",
              "description": "Web Dev, AI/ML, Python, UI/UX, Flutter, DevOps, and B.Tech CSE Industrial Training."
            }
          },
          {
            "@type": "Offer",
            "position": 11,
            "itemOffered": {
              "@type": "Service",
              "name": "Custom CRM & ERP Enterprise Solutions",
              "category": "Enterprise Software",
              "description": "Custom CRM, ERP implementation, Sales Pipelines, HRMS, and Inventory Management."
            }
          },
          {
            "@type": "Offer",
            "position": 12,
            "itemOffered": {
              "@type": "Service",
              "name": "SaaS Architecture & Multi-Tenant Engineering",
              "category": "Product Engineering",
              "description": "B2B SaaS platforms, MVP development, Stripe billing, RBAC, and AI SaaS."
            }
          }
        ]
      }
    }
  ]
});
