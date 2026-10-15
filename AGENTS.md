# Project architecture rules

- Map the project-provided public Vite database URL and publishable key to the Next.js public variable names in `next.config.mjs`; the generated browser client reads the Next.js names while Lovable Cloud supplies the Vite names.
- Keep the root TypeScript configuration standalone for this Next.js app, and expose the production build as `build:dev` because the hosted build runner invokes that script.
- Exclude Deno-based edge functions from the browser app TypeScript project because they are checked in their own runtime.