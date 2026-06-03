/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow next/image to serve celebrity photos from these domains.
    // Add more as needed when you source images from other CDNs.
    remotePatterns: [
      { protocol: 'https', hostname: '**.wikimedia.org' },
      { protocol: 'https', hostname: '**.wikipedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
}

module.exports = nextConfig
