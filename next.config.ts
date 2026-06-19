import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Automatic memoization of components/hooks (React 19 + React Compiler 1.0).
  // Lets us keep hooks readable without hand-tuning every useMemo/useCallback.
  reactCompiler: true,
};

export default nextConfig;
