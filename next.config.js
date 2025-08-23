/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {
    // Temporary workaround for Next.js src directory support
    srcDir: true
  }
}

module.exports = nextConfig