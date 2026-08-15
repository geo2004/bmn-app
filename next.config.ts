import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory makes Turbopack
  // infer C:\Users\User as the workspace root, so `next dev` cannot resolve
  // tailwindcss or next-auth from this project's node_modules and every page
  // 500s. Pinning the root keeps module resolution inside the app.
  turbopack: { root: projectRoot },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

export default nextConfig
