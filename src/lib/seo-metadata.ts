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

  // Variations & Short-tail GEO Terms
  "Best Custom Web Application Development US Next.js React",
  "Top Rated Web Apps United States Next.js React",
  "Hire Dedicated Flutter Developers United Kingdom UK",
  "Hire React Native App Development Agency UK",
  "Enterprise AI Integration Python LangChain Dubai UAE",
  "Enterprise LLM AI Solutions UAE Dubai",
  "Scalable AWS Kubernetes Cloud Consulting Singapore",
  "DevOps Infrastructure Engineering Singapore",
  "Offshore Microservices Architecture Partner Node.js Docker Canada",
  "Node.js Docker Development Firm Canada",
  "Affordable MERN Stack MVP Development Firm Australia",
  "Startup MVP Software Agency Australia",
  "Fractional CTO Services Germany Cloud Native",
  "Legacy Product Modernization Germany Cloud Native",
  "B2B SaaS Development Agency Serverless APIs Global",
  "Remote Serverless API Engineering Global Agency"
];

export const GLOBAL_SEO_META_TAGS = [
  { name: "keywords", content: FORMATTED_SEO_KEYWORDS.join(", ") },
  { name: "geo.region", content: "US, GB, AE-DU, SG, CA, AU, DE, IN" },
  { name: "geo.placename", content: "United States, United Kingdom, Dubai UAE, Singapore, Canada, Australia, Germany, Global" },
  { name: "geo.position", content: "25.2048;55.2708" },
  { name: "ICBM", content: "25.2048, 55.2708" },
  { name: "target-audience", content: "Global Enterprises, Startups, CTOs, Engineering Leaders" },
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
      "description": "Global enterprise software engineering firm. Best / Top rated Custom Web Application (Next.js/React - United States), Hire Dedicated Mobile App Development (Flutter/React Native - United Kingdom), Enterprise AI & LLM Integration (Python/LangChain - UAE/Dubai), Scalable Cloud & DevOps Consulting (AWS/Kubernetes - Singapore), Offshore Partner Microservices Architecture (Node.js/Docker - Canada), Affordable MVP Development Firm (MERN Stack - Australia), Fractional CTO Product Modernization (Cloud Native - Germany), and B2B Agency SaaS Development (Serverless APIs - Global/Remote).",
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
      "knowsAbout": SEO_KEYWORD_MATRIX.map(item => `${item.intent} ${item.service} (${item.stack}) - ${item.targetRegion}`),
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Global Software Engineering & GEO AI Services",
        "itemListElement": SEO_KEYWORD_MATRIX.map((item, index) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Service",
            "name": `${item.intent} ${item.service}`,
            "category": item.service,
            "areaServed": item.targetRegion,
            "description": `${item.intent} ${item.service} services built with ${item.stack} targeting ${item.targetRegion}.`
          }
        }))
      }
    }
  ]
});
