import arcjet, { shield, detectBot, detectPromptInjection } from "@arcjet/next";

// This is the global Arcjet instance
// We export the rules so we can compose them in different routes
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield WAF protects against common attacks like SQL injection
    shield({ mode: "LIVE" }),
    
    // Bot protection blocks scrapers and automated abuse
    detectBot({
      mode: "LIVE",
      // Allow legitimate search engines and crawlers
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});

// Create a specialized instance for AI routes that includes prompt injection protection
export const ajAi = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    detectPromptInjection({ mode: "LIVE" }), // Scan for jailbreaks and prompt injections
  ],
});
