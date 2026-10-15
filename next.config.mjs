/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const nextConfig = {
  reactStrictMode: true,
  // The generated browser client reads Next.js public variables, while the
  // connected project provides these same public values under Vite names.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  },
  images: {
    domains: ['izofcqroxksxtpcelbyd.supabase.co'],
  },
}

export default nextConfig
