# Project architecture rules

- Map the project-provided public Vite database URL and publishable key to the Next.js public variable names in `next.config.mjs`; the generated browser client reads the Next.js names while Lovable Cloud supplies the Vite names.