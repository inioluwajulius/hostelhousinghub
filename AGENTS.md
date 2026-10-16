# Project architecture rules

- Map the project-provided public database URL and publishable key to the Next.js public variable names in `next.config.mjs`, preferring Vite names with Next.js public names as fallback; the generated browser client reads the Next.js names.
- Keep the root TypeScript configuration standalone for this Next.js app, and expose the production build as `build:dev` because the hosted build runner invokes that script.
- Exclude Deno-based edge functions from the browser app TypeScript project because they are checked in their own runtime.
- Load Leaflet-based map views with client-only dynamic imports because Leaflet accesses browser globals during module initialization.