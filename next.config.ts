import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'exceljs', 'pg'],
};

export default nextConfig;
