import type { NextConfig } from 'next';

const config: NextConfig = {
  // Standalone output bundles only what's needed for Railway deployment
  output: 'standalone',
};

export default config;
