/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The generated browser client reads Next.js public variables, while the
  // connected project provides these same public values under Vite names.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  images: {
    domains: ['izofcqroxksxtpcelbyd.supabase.co'],
  },
}

export default nextConfig
